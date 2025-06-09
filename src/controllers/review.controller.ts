import { Request, Response } from 'express';
import prisma from '../prisma';
import { CreateReviewDto } from '../types';

export const createReview = async (req: Request, res: Response) => {
  try {
    const data: CreateReviewDto = req.body;
    const userId = req.user!.id; // From auth middleware

    // Check if nail artist exists and is approved
    const nailArtist = await prisma.nailArtist.findUnique({
      where: { id: data.nailArtistId }
    });

    if (!nailArtist) {
      return res.status(404).json({ message: 'Nail artist not found' });
    }

    if (nailArtist.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Cannot review unapproved nail artist' });
    }

    // Check if user has already reviewed this nail artist
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        nailArtistId: data.nailArtistId
      }
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this nail artist' });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        rating: data.rating,
        comment: data.comment,
        userId,
        nailArtistId: data.nailArtistId
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getReviewsByNailArtist = async (req: Request, res: Response) => {
  try {
    const { nailArtistId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Check if nail artist exists
    const nailArtist = await prisma.nailArtist.findUnique({
      where: { id: Number(nailArtistId) }
    });

    if (!nailArtist) {
      return res.status(404).json({ message: 'Nail artist not found' });
    }

    // Get reviews with pagination
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { nailArtistId: Number(nailArtistId) },
        include: {
          user: {
            select: {
              email: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.review.count({
        where: { nailArtistId: Number(nailArtistId) }
      })
    ]);

    res.json({
      data: reviews,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { rating, comment } = req.body;

    // Check if review exists and belongs to user
    const review = await prisma.review.findFirst({
      where: {
        id: Number(id),
        userId
      }
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id: Number(id) },
      data: {
        rating,
        comment
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Review updated successfully',
      data: updatedReview
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if review exists and belongs to user
    const review = await prisma.review.findFirst({
      where: {
        id: Number(id),
        userId
      }
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    // Delete review
    await prisma.review.delete({
      where: { id: Number(id) }
    });

    res.json({
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 