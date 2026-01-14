# Documento legado

Este guia foi mantido apenas por histórico. Para o deploy atual, consulte [docs/DEPLOY.md](docs/DEPLOY.md).

# Eager Loading vs Lazy Loading in Sequelize

## What is Eager Loading?

Eager loading is a design pattern where you retrieve all necessary data in a single database query by including related associations. This prevents the N+1 query problem.

## What is Lazy Loading?

Lazy loading retrieves related data only when it's accessed, which can lead to performance issues when done in loops.

## The N+1 Query Problem

### Problem Example (What NOT to do):

```javascript
// This creates N+1 queries - very inefficient!
const posts = await Post.findAll(); // 1 query to get posts

// Then for each post, we make additional queries
for (const post of posts) {
  const author = await post.getAuthor();     // N queries for authors
  const comments = await post.getComments(); // N queries for comments  
  const likes = await post.getLikes();       // N queries for likes
}
// Total queries: 1 + (N * 3) where N is number of posts
```

If you have 100 posts, this results in 301 database queries!

### Solution with Eager Loading:

```javascript
// This uses only 1 query - much better!
const posts = await Post.findAll({
  include: [
    {
      model: User,
      as: 'author',
      attributes: ['id', 'username', 'avatar'] // Only get needed fields
    },
    {
      model: Comment,
      as: 'comments',
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    },
    {
      model: Like,
      as: 'likes'
    }
  ]
});
```

## Our Intentionally Broken Examples

### In PostController (backend/src/controllers/postController.ts):

```javascript
// INTENTIONALLY INEFFICIENT - N+1 Problem
const postsWithCounts = await Promise.all(
  posts.rows.map(async (post) => {
    const commentCount = await Comment.count({ where: { postId: post.id } });
    const likeCount = await Like.count({ where: { postId: post.id } });
    const isLiked = req.user 
      ? await Like.findOne({ where: { postId: post.id, userId: req.user.id } }) !== null
      : false;

    return {
      ...post.toJSON(),
      commentCount,
      likeCount,
      isLiked,
    };
  })
);
```

This creates 3 queries for each post! For 50 posts, that's 150 extra queries.

### In Post Model (backend/src/models/Post.ts):

```javascript
// INTENTIONALLY INEFFICIENT - N+1 Problem in method
public async getCommentsWithAuthors(): Promise<any[]> {
  const comments = await this.getComments();
  const commentsWithAuthors = [];
  
  // N+1 Query Problem: This will make a separate query for each comment's author
  for (const comment of comments) {
    const author = await comment.getAuthor();
    commentsWithAuthors.push({
      ...comment.toJSON(),
      author: author.toJSON()
    });
  }
  
  return commentsWithAuthors;
}
```

## How to Fix These Issues

### Fix 1: Proper Eager Loading in Controller

```javascript
// FIXED VERSION - Single query with proper includes
const posts = await Post.findAndCountAll({
  where: whereClause,
  limit: limitNumber,
  offset,
  order: [[sortBy, sortOrder]],
  include: [
    {
      model: User,
      as: 'author',
      attributes: ['id', 'username', 'avatar'],
    },
    {
      model: Comment,
      as: 'comments',
      attributes: ['id'], // Only count, don't need full data
    },
    {
      model: Like,
      as: 'likes',
      attributes: ['id', 'userId'], // Include userId to check if current user liked
    },
  ],
});

// Transform data after fetching
const postsWithCounts = posts.rows.map((post) => ({
  ...post.toJSON(),
  commentCount: post.comments?.length || 0,
  likeCount: post.likes?.length || 0,
  isLiked: req.user 
    ? post.likes?.some(like => like.userId === req.user.id) || false
    : false,
  // Remove the full arrays since we only need counts
  comments: undefined,
  likes: undefined,
}));
```

This comprehensive guide explains the differences between eager and lazy loading, with practical examples from our codebase.