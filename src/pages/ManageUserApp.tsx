import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminStore } from "@/store/adminStore";
import type { Banner, Offer } from "@/store/adminStore";
import { toast } from "@/hooks/use-toast";
import { BannerModal } from "@/components/admin/BannerModal";
import { OfferModal } from "@/components/admin/OfferModal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export default function ManageUserApp() {
  const [activeTab, setActiveTab] = useState("banners");
  
  const { banners, specialOffers, createBanner, updateBanner, deleteBanner, createOffer, updateOffer, deleteOffer } = useAdminStore();
  
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | undefined>();
  const [editingOffer, setEditingOffer] = useState<Offer | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'banner' | 'offer'; id: string } | null>(null);

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

  const handleSaveBanner = (data: { title: string; imageUrl: string; isActive: boolean; validFrom?: string; validTo?: string }) => {
    if (editingBanner) {
      updateBanner(editingBanner.id, data);
      toast({ title: "Banner updated", description: "Hero banner has been updated successfully" });
    } else {
      createBanner(data);
      toast({ title: "Banner created", description: "New hero banner has been added" });
    }
  };

  const handleDeleteBanner = (id: string) => {
    setDeleteTarget({ type: 'banner', id });
    setDeleteDialogOpen(true);
  };

  const handleNewOffer = () => {
    setEditingOffer(undefined);
    setOfferModalOpen(true);
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setOfferModalOpen(true);
  };

  const handleSaveOffer = (data: { title: string; imageUrl: string; mrp: number; sale: number; isActive: boolean }) => {
    if (editingOffer) {
      updateOffer(editingOffer.id, data);
      toast({ title: "Offer updated", description: "Special offer has been updated successfully" });
    } else {
      createOffer(data);
      toast({ title: "Offer created", description: "New special offer has been added" });
    }
  };

  const handleDeleteOffer = (id: string) => {
    setDeleteTarget({ type: 'offer', id });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    
    if (deleteTarget.type === 'banner') {
      deleteBanner(deleteTarget.id);
      toast({ title: "Banner deleted", description: "Hero banner has been removed" });
    } else {
      deleteOffer(deleteTarget.id);
      toast({ title: "Offer deleted", description: "Special offer has been removed" });
    }
    
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage User App</h1>
          <p className="text-muted-foreground mt-1">Configure banners and offers for customers</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="banners">Hero Banners</TabsTrigger>
          <TabsTrigger value="offers">Special Offers</TabsTrigger>
        </TabsList>

        {/* Hero Banners Tab */}
        <TabsContent value="banners" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gap-2" onClick={handleNewBanner}>
              <Plus className="w-4 h-4" />
              New Banner
            </Button>
          </div>

          {banners.length === 0 ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
                <div>
                  <h3 className="font-semibold text-lg">No banners yet</h3>
                  <p className="text-muted-foreground text-sm">Click 'New Banner' to add one</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
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
                        className="border-b border-gray-200 last:border-0 hover:bg-muted/30 transition-colors"
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
                              onClick={() => handleEditBanner(banner)}
                              aria-label={`Edit banner ${banner.title}`}
                            >
                              <Pencil className="w-4 h-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteBanner(banner.id)}
                              aria-label={`Delete banner ${banner.title}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
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

          {specialOffers.length === 0 ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {specialOffers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative">
                      <img
                        src={offer.imageUrl}
                        alt={offer.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">
                        {calculateDiscount(offer.mrp, offer.sale)}% OFF
                      </Badge>
                    </div>
                    <div className="p-4 space-y-3">
                      <h3 className="font-semibold text-lg line-clamp-2">{offer.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground line-through">
                          ₹{offer.mrp.toLocaleString()}
                        </span>
                        <span className="text-xl font-bold text-primary">
                          ₹{offer.sale.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleEditOffer(offer)}
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteOffer(offer.id)}
                          aria-label={`Delete offer ${offer.title}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
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

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={deleteTarget?.type === 'banner' ? "Delete banner?" : "Delete offer?"}
        description={
          deleteTarget?.type === 'banner'
            ? "This will remove the banner from Home. You can't undo."
            : "This will remove the special offer. You can't undo."
        }
        onConfirm={confirmDelete}
      />
    </div>
  );
}
