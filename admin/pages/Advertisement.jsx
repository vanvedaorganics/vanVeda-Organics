import React, { useEffect, useState } from "react";
import {
  Card,
  CardGrid,
  Button,
  Modal,
  AdvertisementForm,
} from "../components";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import appwriteService from "../../src/appwrite/appwriteConfigService";

function Advertisement() {
  const [ads, setAds] = useState([]);
  const [activeAdId, setActiveAdId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [switchingActive, setSwitchingActive] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editAd, setEditAd] = useState(null);

  // Fetch ads + activeAd
  const fetchData = async () => {
    setLoading(true);
    try {
      const [adsRes, activeRes] = await Promise.all([
        appwriteService.listAds(),
        appwriteService.getActiveAd(),
      ]);
      setAds(adsRes.documents);
      setActiveAdId(activeRes?.activeAdId ?? null);
    } catch (error) {
      console.error("Error fetching ads:", error);
      toast.error("Failed to load advertisements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle status toggle
  const handleStatusChange = async (adId, status) => {
    if (status === "active") {
      setSwitchingActive(true);
      try {
        await appwriteService.setActiveAd(adId);
        setActiveAdId(adId);
        toast.success("Active advertisement updated");
      } catch (error) {
        console.error("Error setting active ad:", error);
        toast.error("Failed to set active advertisement");
      } finally {
        setSwitchingActive(false);
      }
    }
  };

  // Handle edit
  const handleEdit = (ad) => {
    setEditAd(ad);
    setModalOpen(true);
  };

  return (
    <div className="p-6 relative">
      {/* Modal for Add/Edit */}
      <Modal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditAd(null);
        }}
        title={editAd ? "Edit Advertisement" : "Add Advertisement"}
      >
        <AdvertisementForm
          defaultValues={editAd}
          onSuccess={() => {
            setModalOpen(false);
            setEditAd(null);
            fetchData();
            toast.success(
              editAd
                ? "Advertisement updated successfully"
                : "Advertisement created successfully"
            );
          }}
        />
      </Modal>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl space-grotesk-bold text-[#084629]">
            Advertisement Management
          </h1>
          <h2 className="text-lg space-grotesk-medium text-gray-600 mb-4">
            Upload and Manage Your Ads Here
          </h2>
        </div>
        <div>
          <Button
            variant=""
            className="bg-[#dfb96a] focus:ring-0 hover:bg-[#c7a55c] text-center "
            onClick={() => setModalOpen(true)}
          >
            <Plus size={15} className="mr-1" /> Add Advertisement
          </Button>
        </div>
      </div>

      <CardGrid>
        {loading ? (
          // Skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-full bg-white rounded-2xl p-5 shadow-md animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="border border-gray-200 rounded-xl p-4 flex justify-between items-center">
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-gray-200 rounded" />
                  <div className="h-8 w-8 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))
        ) : (
          ads.map((ad) => (
            <Card
              key={ad.$id}
              id={ad.$id}
              title={ad.title}
              description={ad.description}
              isActive={ad.$id === activeAdId}
              onStatusChange={handleStatusChange}
              onEdit={() => handleEdit(ad)}
              onDelete={() => {
                console.log("Delete", ad.$id);
                toast.info("Delete feature coming soon");
              }}
            />
          ))
        )}
      </CardGrid>

      {/* Inline overlay loader when switching active ad */}
      {switchingActive && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50">
          <Loader2 className="h-10 w-10 text-[#084629] animate-spin" />
        </div>
      )}
    </div>
  );
}

export default Advertisement;
