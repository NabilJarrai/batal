"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { UserCircleIcon } from "@heroicons/react/24/outline";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

interface PlayerProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  parentName?: string;
  level?: string;
  basicFoot?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  groupName?: string;
  joiningDate?: string;
}

export default function PlayerProfile() {
  const user = useAppSelector((state) => state.auth.user);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<PlayerProfile>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/players/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          phone: data.phone,
          address: data.address,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");
      
      const response = await fetch(`${API_BASE_URL}/players/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setEditing(false);
        setMessage("Profile updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-primary btn-md"
            >
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-4 ${
            message.includes("success") 
              ? "bg-green-500/20 text-accent-teal border border-green-500/30" 
              : "bg-red-500/20 text-accent-red border border-red-500/30"
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full Name</label>
              <p className="text-gray-900 font-medium">
                {profile?.firstName} {profile?.lastName}
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <p className="text-gray-900">{profile?.email}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone</label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-base"
                />
              ) : (
                <p className="text-gray-900">{profile?.phone || "Not provided"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Date of Birth</label>
              <p className="text-gray-900">
                {profile?.dateOfBirth 
                  ? new Date(profile.dateOfBirth).toLocaleDateString() 
                  : "Not provided"}
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Gender</label>
              <p className="text-gray-900">{profile?.gender || "Not provided"}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Address</label>
              {editing ? (
                <textarea
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="input-base"
                />
              ) : (
                <p className="text-gray-900">{profile?.address || "Not provided"}</p>
              )}
            </div>
          </div>

          {/* Academy Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Academy Information</h2>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Parent/Guardian</label>
              <p className="text-gray-900">{profile?.parentName || "Not provided"}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Level</label>
              <p className="text-gray-900">{profile?.level || "Not assigned"}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Preferred Foot</label>
              <p className="text-gray-900">{profile?.basicFoot || "Not specified"}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Group</label>
              <p className="text-gray-900">{profile?.groupName || "Not assigned"}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Joining Date</label>
              <p className="text-gray-900">
                {profile?.joiningDate 
                  ? new Date(profile.joiningDate).toLocaleDateString() 
                  : "Not provided"}
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Emergency Contact Name</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.emergencyContactName || ""}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  className="input-base"
                />
              ) : (
                <p className="text-gray-900">{profile?.emergencyContactName || "Not provided"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Emergency Contact Phone</label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.emergencyContactPhone || ""}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  className="input-base"
                />
              ) : (
                <p className="text-gray-900">{profile?.emergencyContactPhone || "Not provided"}</p>
              )}
            </div>
          </div>
        </div>

        {editing && (
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setFormData({
                  phone: profile?.phone,
                  address: profile?.address,
                  emergencyContactName: profile?.emergencyContactName,
                  emergencyContactPhone: profile?.emergencyContactPhone,
                });
              }}
              className="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}