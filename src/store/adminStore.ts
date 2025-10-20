import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { env } from '@/env';
import { http } from '@/api/client';
import { getSpecialOffers, deleteSpecialOffer } from '@/services/specialOffersService';

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
  createBanner: (banner: Omit<Banner, 'id' | 'updatedAt'>) => void;
  updateBanner: (id: string, banner: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
  reorderBanners: (banners: Banner[]) => void;
  fetchBanners: (params?: { status?: 'ACTIVE' | 'INACTIVE' | 'ALL'; q?: string; limit?: number; offset?: number; orderBy?: string }) => Promise<{ items: Banner[]; total: number; limit: number; offset: number }>;
  
  // Offer methods
  createOffer: (offer: Omit<Offer, 'id' | 'sortOrder' | 'updatedAt'>) => void;
  updateOffer: (id: string, offer: Partial<Offer>) => void;
  deleteOffer: (id: string) => Promise<void>;
  reorderOffers: (offers: Offer[]) => void;
  fetchSpecialOffers: (params?: { status?: 'ACTIVE' | 'INACTIVE' | 'ALL'; q?: string; limit?: number; offset?: number; orderBy?: string }) => Promise<{ items: Offer[]; total: number; limit: number; offset: number }>;
  
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
      banners: env.useMock ? [
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
      ] : [],
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
          const newBanner: Banner = {
            ...banner,
            id: Date.now().toString(),
            sortOrder: banner.sortOrder || Math.max(0, ...state.banners.map((b) => b.sortOrder)) + 1,
            updatedAt: new Date().toISOString().split('T')[0],
          };
          return { banners: [...state.banners, newBanner] };
        }),
      
      updateBanner: (id, updates) => {
        if (env.useMock) {
          set((state) => ({
            banners: state.banners.map((b) =>
              b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : b
            ),
          }));
          return;
        }
        const body: any = {};
        if (typeof updates.title !== 'undefined') body.title = updates.title;
        if (typeof updates.isActive !== 'undefined') body.status = updates.isActive ? 'ACTIVE' : 'INACTIVE';
        if (typeof updates.sortOrder !== 'undefined') body.sort = updates.sortOrder;
        if (typeof updates.imageUrl !== 'undefined') body.imageUrl = updates.imageUrl;
        http.patch(`/admin/hero-banners/${id}`, body)
          .then(() => {
            set((state) => ({
              banners: state.banners.map((b) =>
                b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : b
              ),
            }));
          })
          .catch((e) => {
            console.error('Failed to patch banner', e);
          });
      },
      
      deleteBanner: (id) => {
        if (!env.useMock) {
          http.delete(`/admin/hero-banners/${id}`).catch((e) => {
            console.error('Failed to delete banner', e);
            // still update UI optimistically
          });
        }
        set((state) => ({
          banners: renormalizeSortOrder(state.banners.filter((b) => b.id !== id)),
        }));
      },
      
      reorderBanners: (banners) =>
        set({ banners: renormalizeSortOrder(banners) }),
      
      fetchBanners: async (params = { status: 'ACTIVE', limit: 20, offset: 0, orderBy: 'sort' }) => {
        if (env.useMock) {
          const mock: Banner[] = [
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
          ];
          const normalizedMock = renormalizeSortOrder(mock);
          const limit = params.limit ?? 20;
          const offset = params.offset ?? 0;
          const pageItems = normalizedMock.slice(offset, offset + limit);
          set({ banners: pageItems });
          return { items: pageItems, total: normalizedMock.length, limit, offset };
        }
        const queryParams: any = { limit: params.limit ?? 20, offset: params.offset ?? 0, orderBy: params.orderBy ?? 'sort' };
        if (params.status && params.status !== 'ALL') queryParams.status = params.status;
        if (params.q) queryParams.q = params.q;

        const { data } = await http.get('/admin/hero-banners', { params: queryParams });
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
            ? (data as any).items
            : Array.isArray((data as any)?.results)
              ? (data as any).results
              : [];

        const normalizeDate = (value: any): string => {
          const d = new Date(value ?? Date.now());
          return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
        };

        const normalized: Banner[] = list.map((b: any) => ({
          id: String(b.id ?? b.bannerId ?? b.uuid ?? Date.now()),
          title: b.title ?? b.name ?? 'Untitled',
          imageUrl: b.imageUrl ?? b.image ?? b.pictureUrl ?? '',
          isActive: typeof b.isActive === 'boolean' ? b.isActive : String(b.status ?? '').toUpperCase() === 'ACTIVE',
          sortOrder: Number(b.sortOrder ?? b.sort ?? b.order ?? 0),
          updatedAt: normalizeDate(b.updatedAt ?? b.updated_at ?? b.modifiedAt ?? b.lastUpdated),
          targetType: (b.targetType ?? 'none') as Banner['targetType'],
          targetUrl: b.targetUrl ?? b.link ?? undefined,
        }));

        const normalizedList = renormalizeSortOrder(normalized);
        set({ banners: normalizedList });

        const meta = typeof data === 'object' && data !== null ? (data as any) : {};
        const total: number = Number(meta.total ?? normalizedList.length);
        const limit: number = Number(meta.limit ?? queryParams.limit ?? 20);
        const offset: number = Number(meta.offset ?? queryParams.offset ?? 0);
        return { items: normalizedList, total, limit, offset };
      },
      
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
      
      deleteOffer: async (id) => {
        console.log('[adminStore.deleteOffer] Deleting offer with id:', id);
        
        if (env.useMock) {
          set((state) => ({
            specialOffers: renormalizeSortOrder(state.specialOffers.filter((o) => o.id !== id)),
          }));
          return;
        }
        
        try {
          console.log('[adminStore.deleteOffer] Making API call to delete offer...');
          const response = await deleteSpecialOffer(id);
          console.log('[adminStore.deleteOffer] API delete response:', response);
          
          if (response && response.ok) {
            set((state) => ({
              specialOffers: renormalizeSortOrder(state.specialOffers.filter((o) => o.id !== id)),
            }));
            console.log('[adminStore.deleteOffer] Successfully deleted offer from store');
          } else {
            console.error('[adminStore.deleteOffer] Delete API call failed:', response);
            throw new Error('Failed to delete special offer');
          }
        } catch (error) {
          console.error('[adminStore.deleteOffer] Error deleting offer:', error);
          throw error;
        }
      },
      
      reorderOffers: (offers) =>
        set({ specialOffers: renormalizeSortOrder(offers) }),
      
      fetchSpecialOffers: async (params = { status: 'ACTIVE', limit: 20, offset: 0, orderBy: 'sort' }) => {
        console.log('[adminStore.fetchSpecialOffers] Called with params:', params);
        
        if (env.useMock) {
          const mock: Offer[] = [
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
          ];
          const normalizedMock = renormalizeSortOrder(mock);
          const limit = params.limit ?? 20;
          const offset = params.offset ?? 0;
          const pageItems = normalizedMock.slice(offset, offset + limit);
          set({ specialOffers: pageItems });
          return { items: pageItems, total: normalizedMock.length, limit, offset };
        }
        
        try {
          console.log('[adminStore.fetchSpecialOffers] Making API call...');
          const response = await getSpecialOffers({ 
            status: params.status, 
            limit: params.limit ?? 20, 
            offset: params.offset ?? 0 
          });
          
          console.log('[adminStore.fetchSpecialOffers] API response:', response);
          
          const normalizeDate = (value: any): string => {
            const d = new Date(value ?? Date.now());
            return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
          };

          const normalized: Offer[] = response.items.map((item: any) => ({
            id: String(item.id ?? item.offerId ?? item.uuid ?? Date.now()),
            title: item.productName ?? item.title ?? 'Untitled',
            imageUrl: item.imageUrl ?? item.image ?? item.pictureUrl ?? '',
            mrp: Number(item.price ?? item.mrp ?? 0),
            sale: Number(item.discounted ?? item.sale ?? 0),
            isActive: typeof item.isActive === 'boolean' ? item.isActive : String(item.status ?? '').toUpperCase() === 'ACTIVE',
            sortOrder: Number(item.sortOrder ?? item.sort ?? item.order ?? 0),
            updatedAt: normalizeDate(item.updatedAt ?? item.updated_at ?? item.modifiedAt ?? item.lastUpdated),
          }));

          const normalizedList = renormalizeSortOrder(normalized);
          set({ specialOffers: normalizedList });
          
          console.log('[adminStore.fetchSpecialOffers] Normalized offers:', normalizedList);

          return { 
            items: normalizedList, 
            total: response.total ?? normalizedList.length, 
            limit: response.limit ?? params.limit ?? 20, 
            offset: response.offset ?? params.offset ?? 0 
          };
        } catch (error) {
          console.error('[adminStore.fetchSpecialOffers] Error:', error);
          throw error;
        }
      },
      
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
