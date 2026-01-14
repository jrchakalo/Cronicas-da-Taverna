# AWS S3: Presigned URLs vs Upload Direto

## Visão Geral

Existem duas abordagens principais para upload de arquivos para o Amazon S3:

1. **Upload Direto**: O arquivo é enviado do cliente para o servidor, depois o servidor envia para o S3
2. **Presigned URLs**: O servidor gera uma URL temporária que permite ao cliente fazer upload diretamente para o S3

Este guia foi mantido apenas por histórico. Para o deploy atual, consulte [docs/DEPLOY.md](docs/DEPLOY.md).

## Upload Direto

### Como Funciona

```
Cliente → Servidor Backend → AWS S3 → Resposta → Cliente
```

### Implementação

```javascript
// Backend - Endpoint para upload
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    // Arquivo está disponível em req.file
    const file = req.file;
    
    // Upload para S3
    const uploadParams = {
      Bucket: 'meu-bucket',
      Key: `uploads/${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };
    
    const result = await s3.upload(uploadParams).promise();
    
    res.json({
      url: result.Location,
      key: result.Key
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});
```

```javascript
// Frontend - Upload via servidor
const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return response.json();
};
```

### Vantagens do Upload Direto

1. **Controle Total**: O servidor pode validar, processar e transformar arquivos
2. **Segurança**: Todas as verificações acontecem no servidor
3. **Auditoria**: Fácil de logar e monitorar uploads
4. **Processamento**: Pode redimensionar, otimizar ou converter arquivos
5. **Validação**: Verificação de tipo, tamanho e conteúdo no servidor

### Desvantagens do Upload Direto

1. **Uso de Recursos**: Consome banda e CPU do servidor
2. **Latência**: Dois saltos de rede (cliente→servidor→S3)
3. **Escalabilidade**: Servidor pode se tornar gargalo
4. **Timeout**: Uploads grandes podem exceder timeout do servidor
5. **Custos**: Mais transferência de dados no servidor

## Presigned URLs

### Como Funciona

```
1. Cliente solicita URL → Servidor gera Presigned URL → Cliente
2. Cliente faz upload direto → AWS S3
```

### Implementação

```javascript
// Backend - Gerar Presigned URL
app.post('/upload/presigned-url', authenticateToken, async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    
    // Validações
    if (!isValidFileType(contentType)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }
    
    const key = `uploads/${Date.now()}-${filename}`;
    
    // Gerar presigned URL
    const presignedUrl = await s3.getSignedUrlPromise('putObject', {
      Bucket: 'meu-bucket',
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
      Expires: 300, // 5 minutos
      Conditions: [
        ['content-length-range', 0, 5 * 1024 * 1024], // Máximo 5MB
        ['eq', '$Content-Type', contentType]
      ]
    });
    
    res.json({
      presignedUrl,
      key,
      publicUrl: `https://meu-bucket.s3.amazonaws.com/${key}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate presigned URL' });
  }
});
```

```javascript
// Frontend - Upload com Presigned URL
const uploadWithPresignedUrl = async (file) => {
  // 1. Solicitar presigned URL
  const response = await fetch('/api/upload/presigned-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type
    })
  });
  
  const { presignedUrl, key, publicUrl } = await response.json();
  
  // 2. Upload direto para S3
  const uploadResponse = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type
    },
    body: file
  });
  
  if (uploadResponse.ok) {
    return { url: publicUrl, key };
  }
  
  throw new Error('Upload failed');
};
```

### Vantagens das Presigned URLs

1. **Performance**: Upload direto para S3, sem passar pelo servidor
2. **Escalabilidade**: Não sobrecarrega o servidor
3. **Custo-Efetivo**: Menos uso de recursos do servidor
4. **Velocidade**: Apenas um salto de rede (cliente→S3)
5. **Confiabilidade**: Usa a infraestrutura robusta da AWS

### Desvantagens das Presigned URLs

1. **Menos Controle**: Dificil validar conteúdo antes do upload
2. **Segurança**: Dependente das políticas do S3
3. **Complexidade**: Mais lógica no frontend
4. **CORS**: Precisa configurar CORS no bucket S3
5. **Validação Limitada**: Apenas validações básicas (tamanho, tipo)

## Comparação Detalhada

### Performance

```javascript
// Upload Direto - Duas transferências
// Cliente (5MB) → Servidor → S3 = 10MB total de transferência de rede servidor

// Presigned URL - Uma transferência  
// Cliente (5MB) → S3 = 0MB de transferência no servidor
```

### Segurança

```javascript
// Upload Direto - Validação Completa
const multer = require('multer');
const sharp = require('sharp');

const upload = multer({
  fileFilter: (req, file, cb) => {
    // Validação de tipo MIME
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

app.post('/upload', upload.single('image'), async (req, res) => {
  // Validação adicional
  try {
    const metadata = await sharp(req.file.buffer).metadata();
    if (metadata.width > 4000 || metadata.height > 4000) {
      return res.status(400).json({ error: 'Image too large' });
    }
    
    // Verificar se é realmente uma imagem
    const { width, height, format } = metadata;
    if (!width || !height || !format) {
      return res.status(400).json({ error: 'Invalid image file' });
    }
    
    // Upload seguro
    // ...
  } catch (error) {
    res.status(400).json({ error: 'Invalid image' });
  }
});
```

```javascript
// Presigned URL - Validação Limitada
const generatePresignedUrl = async (filename, contentType) => {
  // Só podemos validar informações básicas
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(contentType)) {
    throw new Error('Invalid content type');
  }
  
  return s3.getSignedUrlPromise('putObject', {
    Bucket: 'bucket',
    Key: filename,
    ContentType: contentType,
    Expires: 300,
    Conditions: [
      ['content-length-range', 0, 5 * 1024 * 1024],
      ['starts-with', '$Content-Type', 'image/']
    ]
  });
};
```

### Custos

```javascript
// Análise de custos para 1000 uploads de 2MB cada

// Upload Direto:
// - Transferência servidor: 1000 × 2MB × 2 = 4GB
// - CPU servidor: Processamento de 1000 arquivos
// - Tempo de resposta: ~30s por arquivo (total)

// Presigned URL:
// - Transferência servidor: ~1KB por presigned URL = 1MB total
// - CPU servidor: Minimal
// - Tempo de resposta: ~2s por arquivo
```

## Casos de Uso

### Use Upload Direto Quando:

1. **Validação Rigorosa**: Precisa validar conteúdo do arquivo
2. **Processamento**: Redimensionar, otimizar, converter arquivos  
3. **Auditoria**: Needs detailed logging
4. **Transformação**: Aplicar watermarks, filtros
5. **Integração**: Salvar metadados no banco de dados
6. **Arquivos Pequenos**: < 1MB, onde latência não é crítica

```javascript
// Exemplo: Upload de avatar com processamento
app.post('/avatar', upload.single('avatar'), async (req, res) => {
  const processedImage = await sharp(req.file.buffer)
    .resize(200, 200)
    .jpeg({ quality: 80 })
    .toBuffer();
  
  const uploadParams = {
    Bucket: 'avatars',
    Key: `users/${req.user.id}/avatar.jpg`,
    Body: processedImage,
    ContentType: 'image/jpeg'
  };
  
  const result = await s3.upload(uploadParams).promise();
  
  // Salvar URL no banco de dados
  await User.update(
    { avatar: result.Location },
    { where: { id: req.user.id } }
  );
  
  res.json({ avatar: result.Location });
});
```

### Use Presigned URLs Quando:

1. **Arquivos Grandes**: > 10MB
2. **Alta Frequência**: Muitos uploads simultâneos
3. **Simplicidade**: Não precisa processar arquivos
4. **Performance**: Velocidade é prioridade
5. **Mobile Apps**: Reduzir uso de dados do servidor
6. **CDN**: Arquivos servidos diretamente do S3/CloudFront

```javascript
// Exemplo: Upload de documentos grandes
app.post('/documents/upload-url', async (req, res) => {
  const { filename, size } = req.body;
  
  // Validações básicas
  if (size > 100 * 1024 * 1024) { // 100MB
    return res.status(400).json({ error: 'File too large' });
  }
  
  const key = `documents/${req.user.id}/${Date.now()}-${filename}`;
  const presignedUrl = await s3.getSignedUrlPromise('putObject', {
    Bucket: 'documents',
    Key: key,
    Expires: 3600, // 1 hora para arquivos grandes
    Conditions: [
      ['content-length-range', 0, 100 * 1024 * 1024]
    ]
  });
  
  // Salvar metadados no banco
  await Document.create({
    userId: req.user.id,
    filename,
    key,
    status: 'pending',
    size
  });
  
  res.json({ presignedUrl, key });
});

// Endpoint para confirmar upload
app.post('/documents/:key/confirm', async (req, res) => {
  await Document.update(
    { status: 'completed' },
    { where: { key: req.params.key, userId: req.user.id } }
  );
  
  res.json({ status: 'confirmed' });
});
```

## Implementação Híbrida

Para obter o melhor dos dois mundos:

```javascript
// Rota para arquivos pequenos (upload direto)
app.post('/upload/small', upload.single('file'), async (req, res) => {
  if (req.file.size > 5 * 1024 * 1024) {
    return res.status(400).json({ 
      error: 'File too large for direct upload. Use presigned URL.' 
    });
  }
  
  // Processar e fazer upload
  // ...
});

// Rota para arquivos grandes (presigned URL)
app.post('/upload/large', async (req, res) => {
  if (req.body.size <= 5 * 1024 * 1024) {
    return res.status(400).json({ 
      error: 'File small enough for direct upload.' 
    });
  }
  
  // Gerar presigned URL
  // ...
});

// Frontend - Escolha automática
const uploadFile = async (file) => {
  const size = file.size;
  
  if (size <= 5 * 1024 * 1024) {
    return uploadDirect(file);
  } else {
    return uploadWithPresignedUrl(file);
  }
};
```

## Configuração do S3 para Presigned URLs

### Política do Bucket

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPresignedUploads",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::meu-bucket/uploads/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-acl": "public-read"
        }
      }
    }
  ]
}
```

### Configuração CORS

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "PUT",
      "POST",
      "GET"
    ],
    "AllowedOrigins": [
      "https://meu-site.com",
      "http://localhost:3000"
    ],
    "ExposeHeaders": [
      "ETag"
    ]
  }
]
```

## Monitoramento e Métricas

### Métricas Upload Direto

```javascript
const uploadMetrics = {
  totalUploads: 0,
  successfulUploads: 0,
  failedUploads: 0,
  averageUploadTime: 0,
  totalBandwidthUsed: 0
};

app.post('/upload', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  uploadMetrics.totalUploads++;
  
  try {
    const result = await uploadToS3(req.file);
    
    uploadMetrics.successfulUploads++;
    uploadMetrics.totalBandwidthUsed += req.file.size * 2; // In + Out
    
    const uploadTime = Date.now() - startTime;
    uploadMetrics.averageUploadTime = 
      (uploadMetrics.averageUploadTime + uploadTime) / 2;
    
    res.json(result);
  } catch (error) {
    uploadMetrics.failedUploads++;
    res.status(500).json({ error: 'Upload failed' });
  }
});
```

### Métricas Presigned URL

```javascript
const presignedMetrics = {
  urlsGenerated: 0,
  urlsUsed: 0,
  averageGenerationTime: 0
};

app.post('/upload/presigned-url', async (req, res) => {
  const startTime = Date.now();
  presignedMetrics.urlsGenerated++;
  
  try {
    const presignedUrl = await generatePresignedUrl(req.body);
    
    const generationTime = Date.now() - startTime;
    presignedMetrics.averageGenerationTime = 
      (presignedMetrics.averageGenerationTime + generationTime) / 2;
    
    res.json({ presignedUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate URL' });
  }
});
```

## Conclusão

A escolha entre Presigned URLs e Upload Direto depende das necessidades específicas:

### Use **Upload Direto** para:
- Validação rigorosa de arquivos
- Processamento/transformação de arquivos  
- Arquivos pequenos (< 5MB)
- Integração com banco de dados
- Auditoria detalhada

### Use **Presigned URLs** para:
- Arquivos grandes (> 10MB)
- Alta concorrência
- Performance crítica
- Aplicações móveis
- Custos de servidor reduzidos

### Implementação Híbrida
Combine ambas as abordagens baseado no tamanho do arquivo e requisitos específicos para obter flexibilidade máxima.