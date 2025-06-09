import { Request, Response } from 'express';
import prisma from '../prisma';
import { PrismaClient, Prisma } from '@prisma/client';

export const getAllNailArtists = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = typeof status !== 'undefined' ? { status: status as string } : {};

    const [nailArtists, total] = await Promise.all([
      prisma.nailArtist.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              role: true
            }
          },
          reviews: true
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.nailArtist.count({ where })
    ]);

    res.json({
      data: nailArtists,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get all nail artists error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const approveNailArtist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const nailArtist = await prisma.nailArtist.update({
      where: { id: Number(id) },
      data: { status: 'APPROVED' },
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        }
      }
    });

    res.json({
      message: 'Nail artist approved successfully',
      data: nailArtist
    });
  } catch (error) {
    console.error('Approve nail artist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const rejectNailArtist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const nailArtist = await prisma.nailArtist.update({
      where: { id: Number(id) },
      data: { status: 'REJECTED' },
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        }
      }
    });

    res.json({
      message: 'Nail artist rejected successfully',
      data: nailArtist
    });
  } catch (error) {
    console.error('Reject nail artist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteNailArtist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete nail artist and associated user in transaction
    await prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
      const nailArtist = await prisma.nailArtist.findUnique({
        where: { id: Number(id) },
        select: { userId: true }
      });

      if (!nailArtist) {
        throw new Error('Nail artist not found');
      }

      // Delete reviews first
      await prisma.review.deleteMany({
        where: { nailArtistId: Number(id) }
      });

      // Delete nail artist
      await prisma.nailArtist.delete({
        where: { id: Number(id) }
      });

      // Delete user
      await prisma.user.delete({
        where: { id: nailArtist.userId }
      });
    });

    res.json({
      message: 'Nail artist deleted successfully'
    });
  } catch (error) {
    console.error('Delete nail artist error:', error);
    if (error instanceof Error && error.message === 'Nail artist not found') {
      return res.status(404).json({ message: 'Nail artist not found' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}; 