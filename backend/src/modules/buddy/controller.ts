import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as buddyService from './service';
import { createBuddyProfileSchema, searchBuddySchema, createBuddyRequestSchema } from './validators';

export async function createProfile(req: AuthRequest, res: Response) {
  const data = createBuddyProfileSchema.parse(req.body);
  const profile = await buddyService.createOrUpdateProfile(req.user!.id, data);
  res.status(201).json({ profile });
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const profile = await buddyService.updateMyProfile(req.user!.id, req.body);
  res.json({ profile });
}

export async function deleteProfile(req: AuthRequest, res: Response) {
  await buddyService.deleteMyProfile(req.user!.id);
  res.json({ message: 'Buddy profile removed' });
}

export async function togglePause(req: AuthRequest, res: Response) {
  const profile = await buddyService.togglePauseProfile(req.user!.id);
  res.json({ profile });
}

export async function uploadBuddyImage(req: AuthRequest, res: Response) {
  console.log('📷 Buddy image upload request from user:', req.user!.id);
  console.log('  File:', req.file ? `${req.file.filename} (${req.file.size} bytes)` : 'none');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  const imageUrl = `/uploads/buddy/${req.file.filename}`;
  
  // Try to add to existing buddy profile — but if no profile exists yet
  // (user is still in onboarding flow), just return the URL.
  try {
    const profile = await buddyService.addBuddyImage(req.user!.id, imageUrl);
    console.log('  ✅ Image added to buddy profile');
    res.json({ profile, imageUrl });
  } catch (err) {
    console.log('  ℹ️  No buddy profile yet, returning URL for onboarding:', (err as Error).message);
    res.json({ imageUrl, profile: null });
  }
}

export async function removeBuddyImage(req: AuthRequest, res: Response) {
  const { imageUrl } = req.body as { imageUrl: string };
  try {
    const profile = await buddyService.removeBuddyImage(req.user!.id, imageUrl);
    res.json({ profile });
  } catch {
    // Profile may not exist yet during onboarding — that's fine
    res.json({ profile: null });
  }
}

export async function searchBuddies(req: AuthRequest, res: Response) {
  const params = searchBuddySchema.parse(req.query);
  const result = await buddyService.searchBuddies(req.user!.id, params);
  res.json(result);
}

export async function getBuddy(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const buddy = await buddyService.getBuddyById(id);
  res.json({ buddy });
}

export async function createRequest(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const data = createBuddyRequestSchema.parse(req.body);
  const request = await buddyService.createRequest(req.user!.id, id, data);
  res.status(201).json({ request });
}

export async function respondToRequest(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const { status, agreedPrice } = req.body as { status: 'accepted' | 'rejected'; agreedPrice?: number };
  const result = await buddyService.respondToRequest(req.user!.id, id, status, agreedPrice);
  res.json(result);
}

export async function getMyProfile(req: AuthRequest, res: Response) {
  const profile = await buddyService.getMyProfile(req.user!.id);
  res.json({ profile });
}

export async function getMyRequests(req: AuthRequest, res: Response) {
  const requests = await buddyService.getMyRequests(req.user!.id);
  res.json({ requests });
}

export async function getIncomingRequests(req: AuthRequest, res: Response) {
  const requests = await buddyService.getIncomingRequests(req.user!.id);
  res.json({ requests });
}

export async function getRequestById(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const request = await buddyService.getRequestById(req.user!.id, id);
  res.json({ request });
}

export async function getBuddyMe(req: AuthRequest, res: Response) {
  const profile = await buddyService.getMyProfile(req.user!.id);
  if (!profile) return res.status(404).json({ error: 'No buddy profile found' });
  res.json({ profile });
}

export async function getActivities(_req: AuthRequest, res: Response) {
  const activities = await buddyService.getActivities();
  res.json({ activities });
}
