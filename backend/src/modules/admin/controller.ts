import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as adminService from './service';

export async function getDashboardStats(_req: AuthRequest, res: Response) {
  const stats = await adminService.getDashboardStats();
  res.json({ stats });
}

export async function getUsers(req: AuthRequest, res: Response) {
  const page = parseInt((req.query.page as string) || '1', 10);
  const search = req.query.search as string | undefined;
  const users = await adminService.getUsers(page, 20, search);
  res.json({ users });
}

export async function updateUserStatus(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const { status, reason } = req.body;
  const result = await adminService.updateUserStatus(id, status, req.user!.id, reason);
  res.json(result);
}

export async function getListings(req: AuthRequest, res: Response) {
  const page = parseInt((req.query.page as string) || '1', 10);
  const search = req.query.search as string | undefined;
  const listings = await adminService.getListings(page, 20, search);
  res.json({ listings });
}

export async function removeListing(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const { reason } = req.body;
  await adminService.removeListing(id, req.user!.id, reason || 'Removed by admin');
  res.json({ message: 'Listing removed' });
}

export async function removeForumPost(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const { reason } = req.body;
  await adminService.removeForumPost(id, req.user!.id, reason || 'Removed by admin');
  res.json({ message: 'Post removed' });
}

export async function createCollege(req: AuthRequest, res: Response) {
  const { name, slug, city, description } = req.body;
  const college = await adminService.createCollege(name, slug, city, description);
  res.status(201).json({ college });
}

export async function createForumCategory(req: AuthRequest, res: Response) {
  const { collegeId, name, slug, description } = req.body;
  const category = await adminService.createForumCategory(collegeId, name, slug, description);
  res.status(201).json({ category });
}

export async function getBuddyProfiles(req: AuthRequest, res: Response) {
  const page = parseInt((req.query.page as string) || '1', 10);
  const profiles = await adminService.getBuddyProfiles(page);
  res.json({ profiles });
}

export async function suspendBuddyProfile(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const { reason } = req.body;
  await adminService.suspendBuddyProfile(id, req.user!.id, reason || 'Suspended by admin');
  res.json({ message: 'Buddy profile suspended' });
}
