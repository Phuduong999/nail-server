import { Request, Response } from 'express';
import prisma from '../prisma';
import { RegisterNailArtistDto, UpdateNailArtistDto } from '../types';
import bcrypt from 'bcryptjs';

export const registerNailArtist = async (req: Request, res: Response) => {
  try {
    const data: RegisterNailArtistDto = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user and nail artist in transaction
    const result = await prisma.$transaction(async (prisma: import('@prisma/client').Prisma.TransactionClient) => {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          role: 'NAIL_ARTIST'
        }
      });

      const nailArtist = await prisma.nailArtist.create({
        data: {
          userId: user.id,
          name: data.name,
          phone: data.phone,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          description: data.description,
          images: data.images || null, // Handle optional images
          status: 'PENDING'
        }
      });

      return { user, nailArtist };
    });

    res.status(201).json({
      message: 'Nail artist registered successfully',
      data: result.nailArtist
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateNailArtist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: UpdateNailArtistDto = req.body;

    const nailArtist = await prisma.nailArtist.update({
      where: { id: Number(id) },
      data: {
        ...data,
        images: data.images || undefined // Handle optional images
      }
    });

    res.json({
      message: 'Nail artist updated successfully',
      data: nailArtist
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getNailArtist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const nailArtist = await prisma.nailArtist.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    });

    if (!nailArtist) {
      return res.status(404).json({ message: 'Nail artist not found' });
    }

    res.json(nailArtist);
  } catch (error) {
    console.error('Get nail artist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const searchNailArtists = async (req: Request, res: Response) => {
  try {
    const {
      search,
      minRating,
      maxDistance,
      latitude,
      longitude,
      page = 1,
      limit = 10,
      sortBy = 'rating',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {
      status: 'APPROVED'
    };

    // Add search condition
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { address: { contains: search as string } },
        { description: { contains: search as string } }
      ];
    }

    // Get all nail artists first to calculate distance
    const nailArtists = await prisma.nailArtist.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        },
        reviews: true
      }
    });

    // Calculate average rating and distance for each nail artist
    const nailArtistsWithStats = nailArtists.map((artist: any) => {
      const avgRating = artist.reviews.length > 0
        ? artist.reviews.reduce((acc: number, review: { rating: number }) => acc + review.rating, 0) / artist.reviews.length
        : 0;

      let distance = null;
      if (latitude && longitude) {
        distance = calculateDistance(
          Number(latitude),
          Number(longitude),
          artist.latitude,
          artist.longitude
        );
      }

      return {
        ...artist,
        averageRating: avgRating,
        distance
      };
    });

    // Filter by rating
    const filteredByRating = minRating
      ? nailArtistsWithStats.filter((artist: any) => artist.averageRating >= Number(minRating))
      : nailArtistsWithStats;

    // Filter by distance
    const filteredByDistance = maxDistance && latitude && longitude
      ? filteredByRating.filter((artist: any) => artist.distance && artist.distance <= Number(maxDistance))
      : filteredByRating;

    // Sort results
    const sortedResults = [...filteredByDistance].sort((a: any, b: any) => {
      if (sortBy === 'rating') {
        return sortOrder === 'desc'
          ? b.averageRating - a.averageRating
          : a.averageRating - b.averageRating;
      } else if (sortBy === 'distance' && a.distance && b.distance) {
        return sortOrder === 'desc'
          ? b.distance - a.distance
          : a.distance - b.distance;
      }
      return 0;
    });

    // Apply pagination
    const total = sortedResults.length;
    const paginatedResults = sortedResults.slice(skip, skip + Number(limit));

    res.json({
      data: paginatedResults,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Search nail artists error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
} 