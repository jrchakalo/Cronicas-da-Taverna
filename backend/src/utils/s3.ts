import AWS from 'aws-sdk';
import { S3UploadResult } from '../types';

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value || !value.trim()) {
    throw new Error(`Variável ${key} não configurada. Verifique as credenciais AWS/S3.`);
  }
  return value.trim();
};

const resolvedRegion = process.env.AWS_REGION || 'us-east-1';
const resolvedBucket = process.env.AWS_S3_BUCKET || '';

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: resolvedRegion,
});

export const uploadToS3 = (
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<S3UploadResult> => {
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
  
  const uploadParams = {
    Bucket: resolvedBucket || requireEnv('AWS_S3_BUCKET'),
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  return new Promise((resolve, reject) => {
    s3.upload(uploadParams, (error: Error, data: AWS.S3.ManagedUpload.SendData) => {
      if (error) {
        reject(error);
      } else {
        resolve(data as S3UploadResult);
      }
    });
  });
};

export const deleteFromS3 = (key: string): Promise<void> => {
  const deleteParams = {
    Bucket: resolvedBucket || requireEnv('AWS_S3_BUCKET'),
    Key: key,
  };

  return new Promise((resolve, reject) => {
    s3.deleteObject(deleteParams, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

export const generateSignedUrl = (key: string, expiresIn: number = 3600): string => {
  return s3.getSignedUrl('getObject', {
    Bucket: resolvedBucket || requireEnv('AWS_S3_BUCKET'),
    Key: key,
    Expires: expiresIn,
  });
};