import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Banner = {
  id: string;
  title: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
  validFrom?: string;
  validTo?: string;
  targetType?: 'offer' | 'product' | 'link' | 'none';
  targetUrl?: string;
};

export type Offer = {
  id: string;
  title: string;
  imageUrl: string;
  mrp: number;
  sale: number;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
};

export type Agent = {
  id: string;
  name: string;
  phone: string;
  shop: string;
  status: 'Active' | 'Suspended';
  activeJobs: number;
  currentStatus: 'Free' | 'Assigned' | 'Accepted' | 'Working' | 'Resolved' | 'Expired';
  sla: 'On Track' | 'At Risk';
  lastAssignment: string;
};

interface AdminStore {
  banners: Banner[];
  specialOffers: Offer[];
  agents: Agent[];
  
  // Banner methods
  createBanner: (banner: Omit<Banner, 'id' | 'sortOrder' | 'updatedAt'>) => void;
  updateBanner: (id: string, banner: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
  reorderBanners: (banners: Banner[]) => void;
  
  // Offer methods
  createOffer: (offer: Omit<Offer, 'id' | 'sortOrder' | 'updatedAt'>) => void;
  updateOffer: (id: string, offer: Partial<Offer>) => void;
  deleteOffer: (id: string) => void;
  reorderOffers: (offers: Offer[]) => void;
  
  // Agent methods
  createAgent: (agent: Omit<Agent, 'id'>) => void;
  updateAgent: (id: string, agent: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
}

const renormalizeSortOrder = <T extends { sortOrder: number }>(items: T[]): T[] => {
  return items
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({ ...item, sortOrder: index + 1 }));
};

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      banners: [
        {
          id: '1',
          title: 'Summer Sale',
          imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
          isActive: true,
          sortOrder: 1,
          updatedAt: '2025-10-10',
        },
        {
          id: '2',
          title: 'New Laptop Collection',
          imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
          isActive: true,
          sortOrder: 2,
          updatedAt: '2025-10-08',
        },
      ],
      specialOffers: [
        {
          id: '1',
          title: 'Gaming Laptop RTX 4060',
          imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
          mrp: 85000,
          sale: 69999,
          isActive: true,
          sortOrder: 1,
          updatedAt: '2025-10-10',
        },
        {
          id: '2',
          title: 'Wireless Mouse Logitech',
          imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
          mrp: 2500,
          sale: 1899,
          isActive: true,
          sortOrder: 2,
          updatedAt: '2025-10-08',
        },
      ],
      agents: [],
      
      // Banner methods
      createBanner: (banner) =>
        set((state) => {
          const maxSort = Math.max(0, ...state.banners.map((b) => b.sortOrder));
          const newBanner: Banner = {
            ...banner,
            id: Date.now().toString(),
            sortOrder: maxSort + 1,
            updatedAt: new Date().toISOString().split('T')[0],
          };
          return { banners: [...state.banners, newBanner] };
        }),
      
      updateBanner: (id, updates) =>
        set((state) => ({
          banners: state.banners.map((b) =>
            b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : b
          ),
        })),
      
      deleteBanner: (id) =>
        set((state) => ({
          banners: renormalizeSortOrder(state.banners.filter((b) => b.id !== id)),
        })),
      
      reorderBanners: (banners) =>
        set({ banners: renormalizeSortOrder(banners) }),
      
      // Offer methods
      createOffer: (offer) =>
        set((state) => {
          const maxSort = Math.max(0, ...state.specialOffers.map((o) => o.sortOrder));
          const newOffer: Offer = {
            ...offer,
            id: Date.now().toString(),
            sortOrder: maxSort + 1,
            updatedAt: new Date().toISOString().split('T')[0],
          };
          return { specialOffers: [...state.specialOffers, newOffer] };
        }),
      
      updateOffer: (id, updates) =>
        set((state) => ({
          specialOffers: state.specialOffers.map((o) =>
            o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : o
          ),
        })),
      
      deleteOffer: (id) =>
        set((state) => ({
          specialOffers: renormalizeSortOrder(state.specialOffers.filter((o) => o.id !== id)),
        })),
      
      reorderOffers: (offers) =>
        set({ specialOffers: renormalizeSortOrder(offers) }),
      
      // Agent methods
      createAgent: (agent) =>
        set((state) => ({
          agents: [{ ...agent, id: Date.now().toString() }, ...state.agents],
        })),
      
      updateAgent: (id, updates) =>
        set((state) => ({
          agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),
      
      deleteAgent: (id) =>
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
        })),
    }),
    {
      name: 'admin-store',
    }
  )
);
