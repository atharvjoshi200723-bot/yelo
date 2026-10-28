import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as feedService from './service';
import { createPostSchema, feedQuerySchema } from './validators';

export async function createPost(req: AuthRequest, res: Response) {
  const data = createPostSchema.parse(req.body);
  const post = await feedService.createPost(req.user!.id, data);
  res.status(201).json({ post });
}

export async function getFeed(req: AuthRequest, res: Response) {
  const params = feedQuerySchema.parse(req.query);
  const result = await feedService.getFeed(req.user!.id, params);
  res.json(result);
}

export async function getPost(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const post = await feedService.getPostById(id, req.user!.id);
  res.json({ post });
}

export async function likePost(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const result = await feedService.likePost(req.user!.id, id);
  res.json(result);
}

export async function savePost(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const result = await feedService.savePost(req.user!.id, id);
  res.json(result);
}

export async function requestJoin(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const result = await feedService.requestJoin(req.user!.id, id);
  res.json(result);
}

export async function getJoinRequests(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const result = await feedService.getJoinRequests(req.user!.id, id);
  res.json(result);
}

export async function acceptJoinRequest(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const requesterId = req.params.userId as string;
  const result = await feedService.acceptJoinRequest(req.user!.id, id, requesterId);
  res.json(result);
}

export async function rejectJoinRequest(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const requesterId = req.params.userId as string;
  const result = await feedService.rejectJoinRequest(req.user!.id, id, requesterId);
  res.json(result);
}

export async function addComment(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const { content } = req.body as { content: string };
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' });
  }
  const comment = await feedService.addComment(req.user!.id, id, content);
  res.status(201).json({ comment });
}

export async function deletePost(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  try {
    await feedService.deletePost(req.user!.id, id, req.user!.role);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    if (err instanceof Error && err.message.includes('not authorized')) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }
    throw err;
  }
}

export async function getComments(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '20', 10);
  const comments = await feedService.getComments(id, page, limit);
  res.json({ comments });
}

export async function deleteComment(req: AuthRequest, res: Response) {
  const commentId = req.params.commentId as string;
  await feedService.deleteComment(req.user!.id, commentId);
  res.json({ message: 'Comment deleted', postId: req.params.postId });
}

export async function getUserPosts(req: AuthRequest, res: Response) {
  const userId = req.params.userId as string;
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '20', 10);
  const posts = await feedService.getUserPosts(userId, page, limit);
  res.json({ posts });
}
