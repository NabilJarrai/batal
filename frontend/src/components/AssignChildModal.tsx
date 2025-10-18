"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { playersAPI, usersAPI } from "@/lib/api";
import { UserResponse } from "@/types/users";

interface AssignChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  parent: UserResponse;
  onComplete: () => void;
}

interface Player {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  groupName?: string;
  level?: string;
  isActive: boolean;
}

export default function AssignChildModal({
  isOpen,
  onClose,
  parent,
  onComplete,
}: AssignChildModalProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAvailablePlayers();
    }
  }, [isOpen]);

  useEffect(() => {
    // Filter players based on search term
    if (searchTerm.trim() === "") {
      setFilteredPlayers(players);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = players.filter((player) => {
        const fullName = `${player.firstName || ""} ${
          player.lastName || ""
        }`.toLowerCase();
        const email = (player.email || "").toLowerCase();
        return fullName.includes(term) || email.includes(term);
      });
      setFilteredPlayers(filtered);
    }
  }, [searchTerm, players]);

  const loadAvailablePlayers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get all active players (now supports multiple parents per player)
      const allPlayers = await playersAPI.getAllList();
      // Filter for active players only - players can have multiple parents
      const availablePlayers = allPlayers.filter((p: any) => p.isActive);
      setPlayers(availablePlayers);
      setFilteredPlayers(availablePlayers);
    } catch (err) {
      console.error("Error loading players:", err);
      setError("Failed to load available players");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlayerId) {
      setError("Please select a player");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await usersAPI.assignChild(parent.id, selectedPlayerId);
      onComplete();
      handleClose();
    } catch (err) {
      console.error("Error assigning child:", err);
      setError(err instanceof Error ? err.message : "Failed to assign child");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedPlayerId(null);
    setSearchTerm("");
    setError(null);
    onClose();
  };

  const calculateAge = (dateOfBirth?: string): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-background-modal border border-border p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium text-text-primary mb-4"
                >
                  Assign Child to {parent.firstName} {parent.lastName}
                </Dialog.Title>

                {error && (
                  <div className="alert-error mb-4">
                    <svg
                      className="h-5 w-5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <p className="text-body">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Search Input */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Search Players
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name or email..."
                      className="input-base w-full"
                    />
                  </div>

                  {/* Players List */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Available Players{" "}
                      {!isLoading && `(${filteredPlayers.length})`}
                    </label>

                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="loading-spinner"></div>
                        <span className="ml-2 text-text-secondary">
                          Loading players...
                        </span>
                      </div>
                    ) : filteredPlayers.length === 0 ? (
                      <div className="text-center py-8 text-text-secondary">
                        {searchTerm
                          ? "No players match your search"
                          : "No active players available"}
                      </div>
                    ) : (
                      <div className="border border-border rounded-lg max-h-96 overflow-y-auto">
                        {filteredPlayers.map((player) => (
                          <button
                            key={player.id}
                            type="button"
                            onClick={() => setSelectedPlayerId(player.id)}
                            className={`w-full p-3 text-left border-b border-border last:border-b-0 transition-colors ${
                              selectedPlayerId === player.id
                                ? "bg-blue-500/20 border-l-4 border-l-blue-500"
                                : "hover:bg-secondary"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                {/* Compact name display */}
                                <p className="font-medium text-text-primary text-sm truncate">
                                  {player.firstName} {player.lastName}
                                </p>
                                {/* Optional compact info for selected items */}
                                {selectedPlayerId === player.id && (
                                  <div className="flex gap-2 mt-1 text-xs text-text-secondary">
                                    {player.dateOfBirth && (
                                      <span>
                                        Age: {calculateAge(player.dateOfBirth)}
                                      </span>
                                    )}
                                    {player.groupName && (
                                      <span>• {player.groupName}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              {selectedPlayerId === player.id && (
                                <div className="flex-shrink-0 ml-2">
                                  <svg
                                    className="h-5 w-5 text-blue-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="btn-secondary btn-md flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedPlayerId}
                      className="btn-primary btn-md flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <div className="loading-spinner mr-2"></div>
                          Assigning...
                        </div>
                      ) : (
                        "Assign Child"
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
