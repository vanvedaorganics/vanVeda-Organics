import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import appwriteConfigService from "../appwrite/appwriteConfigService";
import { Button } from "../components";
import { User, Phone, Mail, MapPin } from "lucide-react";

function Profile() {
  const authUser = useSelector((state) => state.auth.userData); // from authSlice
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await appwriteConfigService.getUserProfile(authUser.$id);

        // Parse address properly
        let parsedAddress = [];
        if (
          res.address &&
          Array.isArray(res.address) &&
          res.address.length > 0
        ) {
          parsedAddress = res.address
            .map((addr) => {
              try {
                return JSON.parse(addr);
              } catch {
                return null;
              }
            })
            .filter(Boolean);
        }

        setProfile({ ...res, parsedAddress });
      } catch (error) {
        console.error("[Profile] Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authUser, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold text-gray-700">
        Profile not found
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-8 md:py-12 font-sans">
      <div className="mx-auto max-w-4xl bg-white rounded-2xl shadow-lg p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[#2D1D1A] text-white shadow-md">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#201413]">
              {profile.displayName}
            </h1>
            <p className="text-[#613D38]">User Profile</p>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-6">
          {/* Email */}
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#2D1D1A]" />
            <span className="text-lg text-[#201413]">{profile.email}</span>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-[#2D1D1A]" />
            <span className="text-lg text-[#201413]">{profile.phone}</span>
          </div>

          {/* Address */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-[#201413] flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Address
            </h2>
            {profile.parsedAddress && profile.parsedAddress.length > 0 ? (
              profile.parsedAddress.map((addr, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-xl p-4 shadow-sm border"
                >
                  <p className="text-[#201413] font-medium">
                    {addr.residencyAddress}
                  </p>
                  {addr.landmark && (
                    <p className="text-[#613D38]">{addr.landmark}</p>
                  )}
                  <p className="text-[#201413]">{addr.street}</p>
                  <p className="text-[#201413]">
                    {addr.pincode}, {addr.city}, {addr.state}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[#613D38]">No address available</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <Button
            size="lg"
            className="flex-1 rounded-xl bg-[#2D1D1A] text-white shadow-md hover:bg-[#2D1D1A]/90 hover:shadow-lg transition-all duration-300"
            onClick={() => navigate("/profile/edit")}
          >
            Edit Profile
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1 rounded-xl border-[#2D1D1A] text-[#2D1D1A] hover:bg-gray-100"
            onClick={() => navigate("/orders")}
          >
            View Orders
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
