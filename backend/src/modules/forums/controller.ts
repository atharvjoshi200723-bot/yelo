import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as forumService from './service';

export async function getColleges(_req: AuthRequest, res: Response) {
  const colleges = await forumService.getColleges();
  res.json({ colleges });
}

export async function getCollege(req: AuthRequest, res: Response) {
  const slug = req.params.slug as string;
  const college = await forumService.getCollegeBySlug(slug);
  const categories = await forumService.getCategories(college.id);
  res.json({ college, categories });
}

export async function getForumPosts(req: AuthRequest, res: Response) {
  const categoryId = req.params.categoryId as string;
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '20', 10);
  const result = await forumService.getForumPosts(categoryId, page, limit, req.user!.id);
  res.json(result);
}

export async function createForumPost(req: AuthRequest, res: Response) {
  const categoryId = req.params.categoryId as string;
  const { title, content, isAnonymous } = req.body as { title: string; content: string; isAnonymous: boolean };
  if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });
  const post = await forumService.createForumPost(req.user!.id, categoryId, title, content, isAnonymous || false);
  res.status(201).json({ post });
}

export async function getForumPost(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const post = await forumService.getForumPostById(id, req.user!.id);
  res.json({ post });
}

export async function upvotePost(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const result = await forumService.upvotePost(req.user!.id, id);
  res.json(result);
}

export async function addComment(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const { content, isAnonymous } = req.body as { content: string; isAnonymous: boolean };
  if (!content) return res.status(400).json({ error: 'Content is required' });
  const comment = await forumService.addComment(req.user!.id, id, content, isAnonymous || false);
  res.status(201).json({ comment });
}

export async function getComments(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '20', 10);
  const comments = await forumService.getComments(id, req.user!.id, page, limit);
  res.json({ comments });
}

export async function deletePost(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  await forumService.deletePost(req.user!.id, id);
  res.json({ message: 'Post deleted' });
}

export async function deleteComment(req: AuthRequest, res: Response) {
  const commentId = req.params.commentId as string;
  await forumService.deleteComment(req.user!.id, commentId);
  res.json({ message: 'Comment deleted' });
}
