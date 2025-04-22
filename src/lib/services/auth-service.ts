import prismadb from '../db';

interface EmailAddress {
  id: string;
  emailAddress: string;
}

export const authService = {
  getUserById: async (userId: string) => {
    return await prismadb.user.findUnique({
      where: { id: userId },
    });
  },

  getUserByExternalId: async (externalId: string) => {
    return await prismadb.user.findUnique({
      where: { externalId },
    });
  },
}; 