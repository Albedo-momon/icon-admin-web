import { useEffect, useMemo, useRef, useState, Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, ImageIcon, Loader2, RefreshCcw, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminStore, type Banner, type Offer, type LaptopOffer } from "@/store/adminStore";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LazyImage } from "@/components/ui/LazyImage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/api/client";

// Lazy load heavy modal components for better performance
const BannerModal = lazy(() => import("@/components/admin/BannerModal").then(module => ({ default: module.BannerModal })));
const OfferModal = lazy(() => import("@/components/admin/OfferModal").then(module => ({ default: module.OfferModal })));
const LaptopOfferModal = lazy(() => import("@/components/admin/LaptopOfferModal").then(module => ({ default: module.LaptopOfferModal })));
const ConfirmDialog = lazy(() => import("@/components/admin/ConfirmDialog").then(module => ({ default: module.ConfirmDialog })));

export default function ManageUserApp() {
  const [activeTab, setActiveTab] = useState("banners");
  
  const banners = useAdminStore(s => s.banners);
  const specialOffers = useAdminStore(s => s.specialOffers);
  const laptopOffers = useAdminStore(s => s.laptopOffers);
  const createBanner = useAdminStore(s => s.createBanner);
  const updateBanner = useAdminStore(s => s.updateBanner);
  const createOffer = useAdminStore(s => s.createOffer);
  const updateOffer = useAdminStore(s => s.updateOffer);
  const deleteOffer = useAdminStore(s => s.deleteOffer);
  const fetchBanners = useAdminStore(s => s.fetchBanners);
  const fetchSpecialOffers = useAdminStore(s => s.fetchSpecialOffers);
  const createLaptopOffer = useAdminStore(s => s.createLaptopOffer);
  const updateLaptopOffer = useAdminStore(s => s.updateLaptopOffer);
  const deleteLaptopOffer = useAdminStore(s => s.deleteLaptopOffer);
  const fetchLaptopOffers = useAdminStore(s => s.fetchLaptopOffers);
  
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [laptopOfferModalOpen, setLaptopOfferModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | undefined>();
  const [editingOffer, setEditingOffer] = useState<Offer | undefined>();
  const [editingLaptopOffer, setEditingLaptopOffer] = useState<any | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'banner' | 'offer' | 'laptop'; id: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Filters & pagination state
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [q, setQ] = useState<string>('');
  const [limit, setLimit] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // In browser, setTimeout returns a number; using number avoids Node Timeout mismatch
  const debounceRef = useRef<number | null>(null);
  const queryClient = useQueryClient();

  const currentPage = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);
  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const calculateDiscount = (mrp: number, salePrice: number) => {
    return Math.round(((mrp - salePrice) / mrp) * 100);
  };

  const handleNewBanner = () => {
    setEditingBanner(undefined);
    setBannerModalOpen(true);
  };

  const handleEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setBannerModalOpen(true);
  };

  const handleSaveBanner = async (data: { title: string; imageUrl: string; status: string; sort: number }) => {
    if (editingBanner) {
      // Only send changed fields to PATCH
      const updates: Partial<Banner> = {};
      if (editingBanner.title !== data.title) updates.title = data.title;
      const nextActive = data.status === "ACTIVE";
      if (editingBanner.isActive !== nextActive) updates.isActive = nextActive;
      if (editingBanner.sortOrder !== data.sort) updates.sortOrder = data.sort;
      if (editingBanner.imageUrl !== data.imageUrl) updates.imageUrl = data.imageUrl;

      // If nothing changed, skip server call but still toast success
      if (Object.keys(updates).length > 0) {
        updateBanner(editingBanner.id, updates);
      }
      toast({ title: "Banner updated", description: "Hero banner has been updated successfully" });
      setBannerModalOpen(false);
      setEditingBanner(undefined);
      await queryClient.invalidateQueries({ queryKey: ["heroBanners"] });
      await queryClient.refetchQueries({ queryKey: ["heroBanners"], type: "active" });
    } else {
      createBanner({
        title: data.title,
        imageUrl: data.imageUrl,
        isActive: data.status === "ACTIVE",
        sortOrder: data.sort,
      });
      toast({ title: "Banner created", description: "New hero banner has been added" });
      setBannerModalOpen(false);
      setEditingBanner(undefined);
      await queryClient.invalidateQueries({ queryKey: ["heroBanners"] });
      await queryClient.refetchQueries({ queryKey: ["heroBanners"], type: "active" });
    }
  };

  const handleDeleteBanner = (id: string) => {
    setDeleteTarget({ type: 'banner', id });
    setDeleteDialogOpen(true);
  };

  const handlePreviewBanner = (banner: Banner) => {
    setPreviewImage({ url: banner.imageUrl, title: banner.title });
    setPreviewModalOpen(true);
  };

  const handleNewOffer = () => {
    setEditingOffer(undefined);
    setOfferModalOpen(true);
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setOfferModalOpen(true);
  };

  const handleSaveOffer = (data: { id?: string; title: string; imageUrl: string; mrp: number; sale: number; isActive: boolean }) => {
    if (editingOffer) {
      if (data.id && data.id !== editingOffer.id) {
        console.warn('[ManageUserApp] syncing offer id after server update', { oldId: editingOffer.id, newId: data.id });
        useAdminStore.setState((state) => ({
          specialOffers: state.specialOffers.map((o) =>
            o.id === editingOffer.id
              ? {
                  ...o,
                  id: data.id!,
                  title: data.title,
                  imageUrl: data.imageUrl,
                  mrp: data.mrp,
                  sale: data.sale,
                  isActive: data.isActive,
                  updatedAt: new Date().toISOString().split('T')[0],
                }
              : o
          ),
        }));
      } else {
        updateOffer(editingOffer.id, {
          title: data.title,
          imageUrl: data.imageUrl,
          mrp: data.mrp,
          sale: data.sale,
          isActive: data.isActive,
        });
      }
    } else {
      if (data.id) {
        console.debug('[ManageUserApp] adding offer with server id', { id: data.id });
        useAdminStore.setState((state) => {
          const maxSort = Math.max(0, ...state.specialOffers.map((o) => o.sortOrder));
          return {
            specialOffers: [
              ...state.specialOffers,
              {
                id: data.id!,
                title: data.title,
                imageUrl: data.imageUrl,
                mrp: data.mrp,
                sale: data.sale,
                isActive: data.isActive,
                sortOrder: maxSort + 1,
                updatedAt: new Date().toISOString().split('T')[0],
              },
            ],
          };
        });
      } else {
        createOffer({
          title: data.title,
          imageUrl: data.imageUrl,
          mrp: data.mrp,
          sale: data.sale,
          isActive: data.isActive,
        });
      }
    }
  };

  const handleDeleteOffer = (id: string) => {
    setDeleteTarget({ type: 'offer', id });
    setDeleteDialogOpen(true);
  };

  const handleNewLaptopOffer = () => {
    setEditingLaptopOffer(undefined);
    setLaptopOfferModalOpen(true);
  };

  const handleEditLaptopOffer = (laptopOffer: any) => {
    setEditingLaptopOffer(laptopOffer);
    setLaptopOfferModalOpen(true);
  };

  const handleSaveLaptopOffer = async (data: { 
    model: string; 
    imageUrl: string; 
    price: number; 
    discounted: number; 
    status: 'ACTIVE' | 'INACTIVE';
    specs?: {
      cpu?: string;
      ram?: string;
      storage?: string;
      display?: string;
    };
  }) => {
    try {
      console.log('[ManageUserApp.handleSaveLaptopOffer] Saving laptop offer:', data);
      
      if (editingLaptopOffer) {
        console.log('[ManageUserApp.handleSaveLaptopOffer] Updating existing laptop offer:', editingLaptopOffer.id);
        await updateLaptopOffer(editingLaptopOffer.id, data);
        toast({ title: "Laptop offer updated", description: "Laptop offer has been updated successfully" });
      } else {
        console.log('[ManageUserApp.handleSaveLaptopOffer] Creating new laptop offer');
        await createLaptopOffer({
          ...data,
          sort: 0,
          discountPercent: Math.round(((data.price - data.discounted) / data.price) * 100),
        });
        toast({ title: "Laptop offer created", description: "New laptop offer has been added" });
      }
      
      setLaptopOfferModalOpen(false);
      setEditingLaptopOffer(undefined);
      
      // Refresh the laptop offers query
      await queryClient.invalidateQueries({ queryKey: ["laptopOffers"] });
      await laptopOffersQuery.refetch();
    } catch (error) {
      console.error('[ManageUserApp.handleSaveLaptopOffer] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save laptop offer';
      toast({ 
        title: "Save failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteLaptopOffer = (id: string) => {
    setDeleteTarget({ type: 'laptop', id });
    setDeleteDialogOpen(true);
  };

  const listParams = useMemo(() => ({ status, limit, offset, sort: "createdAt:desc" }), [status, limit, offset]);
  const listQuery = useQuery({
    queryKey: ["heroBanners", listParams],
    queryFn: async () => {
      const resp = await fetchBanners({ status, q: q || undefined, limit, offset, orderBy: "sort" });
      return { data: resp.items, total: resp.total, limit: resp.limit, offset: resp.offset };
    },
    enabled: activeTab === "banners",
    staleTime: 30_000,
  });

  const specialOffersQuery = useQuery({
    queryKey: ["specialOffers", listParams],
    queryFn: async () => {
      console.log('[ManageUserApp] Fetching special offers with params:', { status, q: q || undefined, limit, offset, orderBy: "sort" });
      const resp = await fetchSpecialOffers({ status, q: q || undefined, limit, offset, orderBy: "sort" });
      console.log('[ManageUserApp] Special offers response:', resp);
      return { data: resp.items, total: resp.total, limit: resp.limit, offset: resp.offset };
    },
    enabled: activeTab === "offers",
    staleTime: 30_000,
  });

  const laptopOffersQuery = useQuery({
    queryKey: ["laptopOffers", listParams],
    queryFn: async () => {
      console.log('[ManageUserApp] Fetching laptop offers with params:', { status, q: q || undefined, limit, offset, orderBy: "sort" });
      const resp = await fetchLaptopOffers({ status, q: q || undefined, limit, offset, orderBy: "sort" });
      console.log('[ManageUserApp] Laptop offers response:', resp);
      return { data: resp.items, total: resp.total, limit: resp.limit, offset: resp.offset };
    },
    enabled: activeTab === "laptops",
    staleTime: 30_000,
  });

  const handleHardRefresh = async () => {
    try {
      setRefreshing(true);
      console.log('[ManageUserApp] Hard refresh triggered for active tab:', activeTab);
      if (activeTab === "banners") {
        await queryClient.invalidateQueries({ queryKey: ["heroBanners"] });
        await listQuery.refetch();
      } else if (activeTab === "offers") {
        await queryClient.invalidateQueries({ queryKey: ["specialOffers"] });
        await specialOffersQuery.refetch();
      } else if (activeTab === "laptops") {
        await queryClient.invalidateQueries({ queryKey: ["laptopOffers"] });
        await laptopOffersQuery.refetch();
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (listQuery.data) {
      setTotal(listQuery.data.total ?? 0);
    }
  }, [listQuery.data]);

  useEffect(() => {
    if (specialOffersQuery.data) {
      setTotal(specialOffersQuery.data.total ?? 0);
    }
  }, [specialOffersQuery.data]);

  useEffect(() => {
    if (laptopOffersQuery.data) {
      setTotal(laptopOffersQuery.data.total ?? 0);
    }
  }, [laptopOffersQuery.data]);

  useEffect(() => {
    if (listQuery.error) {
      const e: any = listQuery.error as any;
      setError(e?.message || "Failed to fetch");
    } else if (specialOffersQuery.error) {
      const e: any = specialOffersQuery.error as any;
      setError(e?.message || "Failed to fetch");
    } else if (laptopOffersQuery.error) {
      const e: any = laptopOffersQuery.error as any;
      setError(e?.message || "Failed to fetch");
    } else {
      setError(null);
    }
  }, [listQuery.error, specialOffersQuery.error, laptopOffersQuery.error]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await http.delete(`/admin/hero-banners/${id}`);
      return data as { ok: boolean; id: string; s3Deleted?: boolean; s3DeleteError?: string };
    },
  });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "offer") {
        console.log('[ManageUserApp.confirmDelete] Deleting special offer:', deleteTarget.id);
        setDeletingId(deleteTarget.id);
        await deleteOffer(deleteTarget.id);
        toast({ title: "Offer deleted", description: "Special offer has been removed" });
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
        // Refresh the special offers query
        await queryClient.invalidateQueries({ queryKey: ["specialOffers"] });
        await specialOffersQuery.refetch();
        return;
      }
      if (deleteTarget.type === "laptop") {
        console.log('[ManageUserApp.confirmDelete] Deleting laptop offer:', deleteTarget.id);
        setDeletingId(deleteTarget.id);
        await deleteLaptopOffer(deleteTarget.id);
        toast({ title: "Laptop offer deleted", description: "Laptop offer has been removed" });
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
        // Refresh the laptop offers query
        await queryClient.invalidateQueries({ queryKey: ["laptopOffers"] });
        await laptopOffersQuery.refetch();
        return;
      }
      setDeletingId(deleteTarget.id);
      const res = await deleteMutation.mutateAsync(deleteTarget.id);
      if (res && res.ok) {
        const detail = res.s3DeleteError ? String(res.s3DeleteError).slice(0, 120) : undefined;
        if (res.s3Deleted) {
          toast({ title: "Banner and image deleted.", description: detail });
        } else {
          toast({ title: "Banner removed. Image cleanup pending.", description: detail });
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["heroBanners"] });
      const refetchResult = await listQuery.refetch();
      const nextTotal = refetchResult.data?.total ?? 0;
      const nextPageCount = Math.max(1, Math.ceil(nextTotal / limit));
      const currPage = Math.floor(offset / limit) + 1;
      if (currPage > nextPageCount) {
        const newPage = nextPageCount;
        const newOffset = Math.max(0, (newPage - 1) * limit);
        setOffset(newOffset);
        updateUrl({ status, q, limit, offset: newOffset });
        await queryClient.invalidateQueries({ queryKey: ["heroBanners"] });
        await listQuery.refetch();
      }
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Delete failed. Try again.";
      toast({ title: "Delete failed. Try again.", description: msg, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  // STEP 6 — Persist & Restore Filters
  useEffect(() => {
    const qpStatus = (searchParams.get("status") || "ALL").toUpperCase();
    const qpPage = Number(searchParams.get("page") || "1");
    const qpPageSize = Number(searchParams.get("pageSize") || "10");
    const qpQ = searchParams.get("q") || "";
    const validStatus: any = ["ALL", "ACTIVE", "INACTIVE"].includes(qpStatus) ? qpStatus : "ALL";
    const validPageSize = [10, 20, 50].includes(qpPageSize) ? qpPageSize : 10;
    const validPage = isNaN(qpPage) || qpPage < 1 ? 1 : qpPage;
    const computedOffset = (validPage - 1) * validPageSize;
    setStatus(validStatus);
    setLimit(validPageSize);
    setOffset(computedOffset);
    setQ(qpQ);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Centralized fetchList using current state
  const fetchList = async (_status: 'ALL' | 'ACTIVE' | 'INACTIVE' = status, _q: string = q, _limit: number = limit, _offset: number = offset) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchBanners({ status: _status, q: _q || undefined, limit: _limit, offset: _offset, orderBy: 'sort' });
      setTotal(resp.total ?? resp.items.length);
      setLimit(resp.limit ?? _limit);
      setOffset(resp.offset ?? _offset);
      // If pagination gap, step back one page automatically
      if (resp.items.length === 0 && (resp.total ?? 0) > 0 && _offset > 0) {
        const newOffset = Math.max(0, _offset - _limit);
        setOffset(newOffset);
        updateUrl({ status: _status, q: _q, limit: _limit, offset: newOffset });
        const again = await fetchBanners({ status: _status, q: _q || undefined, limit: _limit, offset: newOffset, orderBy: 'sort' });
        setTotal(again.total ?? resp.total ?? 0);
      }
    } catch (e: any) {
      console.error('Failed to fetch banners', e);
      setError(e?.message || 'Failed to fetch');
      toast({ title: 'Error', description: e?.message || 'Failed to load banners', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateUrl = (next: { status: 'ALL' | 'ACTIVE' | 'INACTIVE'; q: string; limit: number; offset: number }) => {
    const params: any = {};
    if (next.status && next.status !== 'ALL') params.status = next.status;
    if (next.q) params.q = next.q;
    const nextPage = Math.floor(next.offset / next.limit) + 1;
    params.page = String(nextPage);
    params.pageSize = String(next.limit);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CSM</h1>
          <p className="text-muted-foreground mt-1">Configure banners and offers for customers</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        console.log('[ManageUserApp] Tab changed to:', value);
        setActiveTab(value);
      }}>
        <TabsList className="w-full flex flex-wrap gap-2">
          <TabsTrigger value="banners">Hero Banners</TabsTrigger>
          <TabsTrigger value="offers">Special Offers</TabsTrigger>
          <TabsTrigger value="laptops">Laptop Offers</TabsTrigger>
        </TabsList>

        {/* Hero Banners Tab */}
        <TabsContent value="banners" className="space-y-4">
          {/* Toolbar: Status filter, Search, Pagination size, New Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ToggleGroup type="single" value={status} onValueChange={(val) => {
                const next = (val || 'ALL') as 'ALL'|'ACTIVE'|'INACTIVE';
                setStatus(next);
                setOffset(0);
                updateUrl({ status: next, q, limit, offset: 0 });
                void fetchList(next, q, limit, 0);
              }}>
                <ToggleGroupItem value="ALL">All</ToggleGroupItem>
                <ToggleGroupItem value="ACTIVE">Active</ToggleGroupItem>
                <ToggleGroupItem value="INACTIVE">Inactive</ToggleGroupItem>
              </ToggleGroup>
              <div className="relative w-64">
                <Input
                  placeholder="Search title..."
                  value={q}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQ(val);
                    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
                    debounceRef.current = window.setTimeout(() => {
                      setOffset(0);
                      updateUrl({ status, q: val, limit, offset: 0 });
                      void fetchList(status, val, limit, 0);
                    }, 400);
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Page size</span>
                <Select
                  value={String(limit)}
                  onValueChange={(v) => {
                    const next = Number(v);
                    setLimit(next);
                    setOffset(0);
                    updateUrl({ status, q, limit: next, offset: 0 });
                    void fetchList(status, q, next, 0);
                  }}
                >
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Refresh banners"
                title="Refresh"
                onClick={handleHardRefresh}
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCcw className="w-4 h-4" />
                )}
              </Button>
              <Button className="gap-2" onClick={handleNewBanner}>
                <Plus className="w-4 h-4" />
                New Banner
              </Button>
            </div>
          </div>

          {listQuery.isLoading ? (
            <Card className="p-12">
              <LoadingSpinner text="Loading banners..." />
            </Card>
          ) : error ? (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-destructive">Failed to load list.</div>
                <Button variant="outline" size="sm" onClick={() => listQuery.refetch()}>Retry</Button>
              </div>
            </Card>
          ) : banners.length === 0 ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
                <div>
                  <h3 className="font-semibold text-lg">{total === 0 ? 'No banners yet' : 'No banners match your filters'}</h3>
                  <p className="text-muted-foreground text-sm">{total === 0 ? "Click 'New Banner' to add one" : 'Try adjusting filters or search'}</p>
                </div>
              </div>
            </Card>
          ) : (
            <>
              {/* Mobile list view */}
              <div className="sm:hidden space-y-3">
                {banners.map((banner, index) => (
                  <motion.div
                    key={banner.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-lg border border-gray-200 bg-muted/30 overflow-hidden"
                  >
                    <div className="w-full aspect-[16/9] overflow-hidden">
                      <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-medium">{banner.title}</div>
                        <Badge variant={banner.isActive ? "default" : "secondary"}>
                          {banner.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <div className="text-xs text-muted-foreground">Sort: {banner.sortOrder}</div>
                        <div className="text-xs text-muted-foreground">{banner.updatedAt}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreviewBanner(banner)}
                          disabled={deletingId === banner.id}
                          aria-label={`Preview banner ${banner.title}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditBanner(banner)}
                          disabled={deletingId === banner.id}
                          aria-label={`Edit banner ${banner.title}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBanner(banner.id)}
                          disabled={deletingId === banner.id}
                          aria-label={`Delete banner ${banner.title}`}
                        >
                          {deletingId === banner.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {/* Mobile Pagination */}
                <div className="flex items-center justify-between px-2 py-3">
                  <div className="text-sm text-muted-foreground">Total: {total}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={offset === 0}
                      onClick={() => {
                        const nextOffset = Math.max(0, offset - limit);
                        setOffset(nextOffset);
                        updateUrl({ status, q, limit, offset: nextOffset });
                        void listQuery.refetch();
                      }}
                    >
                      Prev
                    </Button>
                    <span className="text-sm">{currentPage} / {pageCount}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={offset + limit >= total}
                      onClick={() => {
                        const nextOffset = offset + limit;
                        setOffset(nextOffset);
                        updateUrl({ status, q, limit, offset: nextOffset });
                        void listQuery.refetch();
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>

              {/* Desktop table */}
              <Card className="hidden sm:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                  <thead className="border-b border-gray-200 bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold text-sm">Preview</th>
                      <th className="text-left p-4 font-semibold text-sm">Title</th>
                      <th className="text-left p-4 font-semibold text-sm">Status</th>
                      <th className="text-left p-4 font-semibold text-sm">Sort Order</th>
                      <th className="text-left p-4 font-semibold text-sm">Updated</th>
                      <th className="text-right p-4 font-semibold text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banners.map((banner, index) => (
                      <motion.tr
                        key={banner.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-gray-200 last:border-0"
                      >
                        <td className="p-4">
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="w-24 h-16 object-cover rounded-lg"
                          />
                        </td>
                        <td className="p-4 font-medium">{banner.title}</td>
                        <td className="p-4">
                          <Badge variant={banner.isActive ? "default" : "secondary"}>
                            {banner.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-4">{banner.sortOrder}</td>
                        <td className="p-4 text-muted-foreground text-sm">{banner.updatedAt}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handlePreviewBanner(banner)}
                              disabled={deletingId === banner.id}
                              aria-label={`Preview banner ${banner.title}`}
                            >
                              <Eye className="w-4 h-4" />
                              <span className="sr-only">Preview</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditBanner(banner)}
                              disabled={deletingId === banner.id}
                              aria-label={`Edit banner ${banner.title}`}
                            >
                              <Pencil className="w-4 h-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteBanner(banner.id)}
                              disabled={deletingId === banner.id}
                              aria-label={`Delete banner ${banner.title}`}
                            >
                              {deletingId === banner.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                              ) : (
                                <Trash2 className="w-4 h-4 text-destructive" />
                              )}
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">Total: {total} • Page {currentPage} / {pageCount}</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={offset === 0}
                    onClick={() => {
                      const nextOffset = Math.max(0, offset - limit);
                      setOffset(nextOffset);
                      updateUrl({ status, q, limit, offset: nextOffset });
                      void listQuery.refetch();
                    }}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={offset + limit >= total}
                    onClick={() => {
                      const nextOffset = offset + limit;
                      setOffset(nextOffset);
                      updateUrl({ status, q, limit, offset: nextOffset });
                      void listQuery.refetch();
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Card>
            </>
          )}
        </TabsContent>

        {/* Special Offers Tab */}
        <TabsContent value="offers" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gap-2" onClick={handleNewOffer}>
              <Plus className="w-4 h-4" />
              New Offer
            </Button>
          </div>

          {specialOffersQuery.isLoading ? (
            <Card className="p-12">
              <LoadingSpinner text="Loading special offers..." />
            </Card>
          ) : error ? (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-destructive">Failed to load special offers.</div>
                <Button variant="outline" size="sm" onClick={() => specialOffersQuery.refetch()}>Retry</Button>
              </div>
            </Card>
          ) : specialOffers.length === 0 ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
                <div>
                  <h3 className="font-semibold text-lg">No special offers yet</h3>
                  <p className="text-muted-foreground text-sm">Click 'New Offer' to add one</p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {specialOffers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`overflow-hidden ${!offer.isActive ? 'opacity-60' : ''}`}>
                    <div className="aspect-square relative">
                      <img
                        src={offer.imageUrl}
                        alt={offer.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs">
                        {calculateDiscount(offer.mrp, offer.sale)}% OFF
                      </Badge>
                      <Badge 
                        className={`absolute top-2 left-2 text-xs ${
                          offer.isActive 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-500 text-white'
                        }`}
                      >
                        {offer.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="p-3 space-y-2">
                      <h3 className="font-semibold text-sm line-clamp-2">{offer.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{offer.mrp.toLocaleString()}
                        </span>
                        <span className="text-sm font-bold text-primary">
                          ₹{offer.sale.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 pt-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs px-2 py-1 h-7"
                          onClick={() => handleEditOffer(offer)}
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="px-2 py-1 h-7"
                          onClick={() => handleDeleteOffer(offer.id)}
                          aria-label={`Delete offer ${offer.title}`}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Laptop Offers Tab */}
        <TabsContent value="laptops" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gap-2" onClick={handleNewLaptopOffer}>
              <Plus className="w-4 h-4" />
              New Laptop Offer
            </Button>
          </div>

          {laptopOffersQuery.isLoading ? (
            <Card className="p-12">
              <LoadingSpinner text="Loading laptop offers..." />
            </Card>
          ) : error ? (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-destructive">Failed to load laptop offers.</div>
                <Button variant="outline" size="sm" onClick={() => laptopOffersQuery.refetch()}>Retry</Button>
              </div>
            </Card>
          ) : laptopOffers.length === 0 ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
                <div>
                  <h3 className="font-semibold text-lg">No laptop offers yet</h3>
                  <p className="text-muted-foreground text-sm">Click 'New Laptop Offer' to add one</p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {(laptopOffers || []).map((laptopOffer: LaptopOffer, index: number) => (
                <motion.div
                  key={laptopOffer.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`overflow-hidden ${laptopOffer.status === 'INACTIVE' ? 'opacity-60' : ''}`}>
                    <div className="aspect-square relative">
                      <LazyImage
                        src={laptopOffer.imageUrl || 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400'}
                        alt={laptopOffer.model}
                        fallbackSrc="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400"
                        className="w-full h-full object-cover"
                        placeholder={
                          <div className="flex items-center justify-center h-full">
                            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                          </div>
                        }
                      />
                      <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs">
                        {laptopOffer.discountPercent}% OFF
                      </Badge>
                      <Badge 
                        className={`absolute top-2 left-2 text-xs ${
                          laptopOffer.status === 'ACTIVE' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-500 text-white'
                        }`}
                      >
                        {laptopOffer.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="p-3 space-y-2">
                      <h3 className="font-semibold text-sm line-clamp-2">{laptopOffer.model}</h3>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {laptopOffer.specs && (
                          <>
                            {laptopOffer.specs.cpu && <div><strong>CPU:</strong> {laptopOffer.specs.cpu}</div>}
                            {laptopOffer.specs.ram && <div><strong>RAM:</strong> {laptopOffer.specs.ram}</div>}
                            {laptopOffer.specs.storage && <div><strong>Storage:</strong> {laptopOffer.specs.storage}</div>}
                            {laptopOffer.specs.display && <div><strong>Display:</strong> {laptopOffer.specs.display}</div>}
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{laptopOffer.price.toLocaleString()}
                        </span>
                        <span className="text-sm font-bold text-primary">
                          ₹{laptopOffer.discounted.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 pt-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs px-2 py-1 h-7"
                          onClick={() => handleEditLaptopOffer(laptopOffer)}
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="px-2 py-1 h-7"
                          onClick={() => handleDeleteLaptopOffer(laptopOffer.id)}
                          aria-label={`Delete laptop offer ${laptopOffer.model}`}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Suspense fallback={<LoadingSpinner size="sm" />}>
        <BannerModal
          open={bannerModalOpen}
          onOpenChange={setBannerModalOpen}
          onSave={handleSaveBanner}
          banner={editingBanner}
        />

        <OfferModal
          open={offerModalOpen}
          onOpenChange={setOfferModalOpen}
          onSave={handleSaveOffer}
          offer={editingOffer}
        />

        <LaptopOfferModal
          open={laptopOfferModalOpen}
          onOpenChange={setLaptopOfferModalOpen}
          onSave={handleSaveLaptopOffer}
          offer={editingLaptopOffer}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title={deleteTarget?.type === 'banner' ? "Delete banner?" : deleteTarget?.type === 'laptop' ? "Delete laptop offer?" : "Delete offer?"}
          description={
            deleteTarget?.type === 'banner'
              ? "This will remove the banner from Home. You can't undo."
              : deleteTarget?.type === 'laptop'
              ? "This will remove the laptop offer. You can't undo."
              : "This will remove the special offer. You can't undo."
          }
          isLoading={deleteMutation.isPending}
          loadingText={deleteTarget?.type === 'banner' ? 'Deleting banner and image...' : deleteTarget?.type === 'laptop' ? 'Deleting laptop offer...' : 'Deleting offer...'}
          onConfirm={confirmDelete}
        />
      </Suspense>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Banner Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-full max-h-[70vh] overflow-hidden rounded-lg">
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">{previewImage.title}</h3>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
