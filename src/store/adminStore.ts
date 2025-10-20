import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { env } from '@/env';
import { http } from '@/api/client';
import { getSpecialOffers, deleteSpecialOffer } from '@/services/specialOffersService';
import { getLaptopOffers, createLaptopOffer, updateLaptopOffer, deleteLaptopOffer } from '@/services/laptopOffersService';

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

export type LaptopOffer = {
  id: string;
  model: string;
  price: number;
  discounted: number;
  discountPercent: number;
  status: 'ACTIVE' | 'INACTIVE';
  imageUrl?: string;
  specs?: Record<string, any>;
  sort: number;
  createdAt: string;
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
  laptopOffers: LaptopOffer[];
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
  
  // Laptop Offer methods
  createLaptopOffer: (offer: Omit<LaptopOffer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLaptopOffer: (id: string, offer: Partial<LaptopOffer>) => Promise<void>;
  deleteLaptopOffer: (id: string) => Promise<void>;
  fetchLaptopOffers: (params?: { status?: 'ACTIVE' | 'INACTIVE' | 'ALL'; q?: string; limit?: number; offset?: number; orderBy?: string }) => Promise<{ items: LaptopOffer[]; total: number; limit: number; offset: number }>;
  
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
      laptopOffers: [
        {
          id: '1',
          model: 'Dell XPS 13',
          price: 120000,
          discounted: 99999,
          discountPercent: 17,
          status: 'ACTIVE',
          imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
          specs: {
            cpu: 'Intel i7-1165G7',
            ram: '16GB DDR4',
            storage: '512GB SSD',
            display: '13.4" FHD+'
          },
          sort: 1,
          createdAt: '2025-10-10',
          updatedAt: '2025-10-10',
        },
        {
          id: '2',
          model: 'MacBook Pro M2',
          price: 150000,
          discounted: 129999,
          discountPercent: 13,
          status: 'ACTIVE',
          imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
          specs: {
            cpu: 'Apple M2',
            ram: '8GB Unified',
            storage: '256GB SSD',
            display: '13" Retina'
          },
          sort: 2,
          createdAt: '2025-10-08',
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
      
      // Laptop Offer methods
      createLaptopOffer: async (offer) => {
        console.log('[adminStore.createLaptopOffer] Creating laptop offer:', offer);
        
        if (env.useMock) {
          const newOffer: LaptopOffer = {
            ...offer,
            id: Date.now().toString(),
            discountPercent: Math.round(((offer.price - offer.discounted) / offer.price) * 100),
            sort: offer.sort || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set((state) => ({
            laptopOffers: [...state.laptopOffers, newOffer],
          }));
          return;
        }
        
        try {
          console.log('[adminStore.createLaptopOffer] Making API call...');
          const response = await createLaptopOffer({
            model: offer.model,
            price: offer.price,
            discounted: offer.discounted,
            status: offer.status,
            imageUrl: offer.imageUrl || 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', // Required by backend
            specs: offer.specs,
          });
          
          console.log('[adminStore.createLaptopOffer] API response:', response);
          
          const newOffer: LaptopOffer = {
            id: response.id,
            model: response.productName || response.model, // Backend stores as productName
            price: response.price,
            discounted: response.discounted,
            discountPercent: response.discountPercent,
            status: response.status,
            imageUrl: response.imageUrl,
            specs: response.specs,
            sort: response.sortOrder || response.sort || 0,
            createdAt: response.createdAt,
            updatedAt: response.updatedAt,
          };
          
          set((state) => ({
            laptopOffers: [...state.laptopOffers, newOffer],
          }));
          
          console.log('[adminStore.createLaptopOffer] Successfully added to store');
        } catch (error) {
          console.error('[adminStore.createLaptopOffer] Error:', error);
          throw error;
        }
      },
      
      updateLaptopOffer: async (id, updates) => {
        console.log('[adminStore.updateLaptopOffer] Updating laptop offer:', { id, updates });
        
        if (env.useMock) {
          set((state) => ({
            laptopOffers: state.laptopOffers.map((o) =>
              o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
            ),
          }));
          return;
        }
        
        try {
          console.log('[adminStore.updateLaptopOffer] Making API call...');
          // Filter out undefined values and ensure imageUrl is valid
          const updateData: any = {};
          if (updates.model !== undefined) updateData.model = updates.model;
          if (updates.price !== undefined) updateData.price = updates.price;
          if (updates.discounted !== undefined) updateData.discounted = updates.discounted;
          if (updates.status !== undefined) updateData.status = updates.status;
          if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;
          if (updates.specs !== undefined) updateData.specs = updates.specs;
          
          const response = await updateLaptopOffer(id, updateData);
          console.log('[adminStore.updateLaptopOffer] API response:', response);
          
          set((state) => ({
            laptopOffers: state.laptopOffers.map((o) =>
              o.id === id ? {
                ...o,
                model: response.productName || response.model, // Backend stores as productName
                price: response.price,
                discounted: response.discounted,
                discountPercent: response.discountPercent,
                status: response.status,
                imageUrl: response.imageUrl,
                specs: response.specs,
                sort: response.sortOrder || response.sort || o.sort,
                updatedAt: response.updatedAt,
              } : o
            ),
          }));
          
          console.log('[adminStore.updateLaptopOffer] Successfully updated in store');
        } catch (error) {
          console.error('[adminStore.updateLaptopOffer] Error:', error);
          throw error;
        }
      },
      
      deleteLaptopOffer: async (id) => {
        console.log('[adminStore.deleteLaptopOffer] Deleting laptop offer:', id);
        
        if (env.useMock) {
          set((state) => ({
            laptopOffers: state.laptopOffers.filter((o) => o.id !== id),
          }));
          return;
        }
        
        try {
          console.log('[adminStore.deleteLaptopOffer] Making API call...');
          const response = await deleteLaptopOffer(id);
          console.log('[adminStore.deleteLaptopOffer] API response:', response);
          
          if (response && response.ok) {
            set((state) => ({
              laptopOffers: state.laptopOffers.filter((o) => o.id !== id),
            }));
            console.log('[adminStore.deleteLaptopOffer] Successfully deleted from store');
          } else {
            console.error('[adminStore.deleteLaptopOffer] Delete API call failed:', response);
            throw new Error('Failed to delete laptop offer');
          }
        } catch (error) {
          console.error('[adminStore.deleteLaptopOffer] Error:', error);
          throw error;
        }
      },
      
      fetchLaptopOffers: async (params = { status: 'ACTIVE', limit: 20, offset: 0, orderBy: 'sort' }) => {
        console.log('[adminStore.fetchLaptopOffers] Called with params:', params);
        
        if (env.useMock) {
          const mock: LaptopOffer[] = [
            {
              id: '1',
              model: 'Dell XPS 13',
              price: 120000,
              discounted: 99999,
              discountPercent: 17,
              status: 'ACTIVE',
              imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
              specs: {
                cpu: 'Intel i7-1165G7',
                ram: '16GB DDR4',
                storage: '512GB SSD',
                display: '13.4" FHD+'
              },
              sort: 1,
              createdAt: '2025-10-10',
              updatedAt: '2025-10-10',
            },
            {
              id: '2',
              model: 'MacBook Pro M2',
              price: 150000,
              discounted: 129999,
              discountPercent: 13,
              status: 'ACTIVE',
              imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
              specs: {
                cpu: 'Apple M2',
                ram: '8GB Unified',
                storage: '256GB SSD',
                display: '13" Retina'
              },
              sort: 2,
              createdAt: '2025-10-08',
              updatedAt: '2025-10-08',
            },
          ];
          const limit = params.limit ?? 20;
          const offset = params.offset ?? 0;
          const pageItems = mock.slice(offset, offset + limit);
          set({ laptopOffers: pageItems });
          return { items: pageItems, total: mock.length, limit, offset };
        }
        
        try {
          console.log('[adminStore.fetchLaptopOffers] Making API call...');
          const response = await getLaptopOffers({ 
            status: params.status, 
            limit: params.limit ?? 20, 
            offset: params.offset ?? 0 
          });
          
          console.log('[adminStore.fetchLaptopOffers] API response:', response);
          
          const normalizeDate = (value: any): string => {
            const d = new Date(value ?? Date.now());
            return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
          };

          const normalized: LaptopOffer[] = response.items.map((item: any) => ({
            id: String(item.id ?? item.offerId ?? item.uuid ?? Date.now()),
            model: item.productName ?? item.model ?? 'Untitled', // Backend stores as productName
            price: Number(item.price ?? 0),
            discounted: Number(item.discounted ?? 0),
            discountPercent: Number(item.discountPercent ?? 0),
            status: (item.status ?? 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
            imageUrl: item.imageUrl ?? item.image ?? item.pictureUrl ?? 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
            specs: item.specs ?? undefined,
            sort: Number(item.sortOrder ?? item.sort ?? 0),
            createdAt: normalizeDate(item.createdAt ?? item.created_at ?? item.created),
            updatedAt: normalizeDate(item.updatedAt ?? item.updated_at ?? item.modifiedAt ?? item.lastUpdated),
          }));

          set({ laptopOffers: normalized });
          
          console.log('[adminStore.fetchLaptopOffers] Normalized offers:', normalized);

          return { 
            items: normalized, 
            total: response.total ?? normalized.length, 
            limit: response.limit ?? params.limit ?? 20, 
            offset: response.offset ?? params.offset ?? 0 
          };
        } catch (error) {
          console.error('[adminStore.fetchLaptopOffers] Error:', error);
          throw error;
        }
      },
    }),
    {
      name: 'admin-store',
    }
  )
);
