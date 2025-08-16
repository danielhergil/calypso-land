import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Users, Calendar, X, Save, Upload, AlertTriangle, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Team, Player } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../firebase/services';
import { isValidImageFile, formatFileSize } from '../utils/imageCompression';
import { showError, showWarning } from '../utils/notifications';

const Teams: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserTeams = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userTeams = await firestoreService.getUserTeams(user.uid);
        setTeams(userTeams);
      } catch (error) {
        console.error('Error loading user teams');
      } finally {
        setLoading(false);
      }
    };

    loadUserTeams();
  }, [user]);

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'team' | 'player';
    isOpen: boolean;
    item: { id: string; name: string } | null;
  }>({
    type: 'team',
    isOpen: false,
    item: null
  });
  const [teamForm, setTeamForm] = useState<{
    name: string;
    alias: string;
    logoFile: File | null;
    logoPreview: string | null;
    originalSize: number | null;
  }>({
    name: '',
    alias: '',
    logoFile: null,
    logoPreview: null,
    originalSize: null
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerForm, setPlayerForm] = useState<{ number: string; playerName: string }>({
    number: '',
    playerName: ''
  });
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleAddTeam = () => {
    setSelectedTeam(null);
    setTeamForm({
      name: '',
      alias: '',
      logoFile: null,
      logoPreview: null,
      originalSize: null
    });
    setPlayers([]);
    setShowPlayerForm(false);
    setIsModalOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setTeamForm({
      name: team.name,
      alias: team.alias,
      logoFile: null,
      logoPreview: team.logo || null,
      originalSize: null
    });
    setPlayers([...team.players]);
    setShowPlayerForm(false);
    setIsModalOpen(true);
  };

  const handleDeleteTeam = (teamId: string, teamName: string) => {
    setDeleteConfirmation({
      type: 'team',
      isOpen: true,
      item: { id: teamId, name: teamName }
    });
  };

  const confirmDeleteTeam = async () => {
    if (!user || !deleteConfirmation.item) return;
    
    try {
      const teamToDelete = teams.find(t => (t as any).id === deleteConfirmation.item!.id);
      if (teamToDelete?.logo) {
        await firestoreService.deleteTeamLogo(user.uid, teamToDelete.name, teamToDelete.logo);
      }
      await firestoreService.deleteUserTeam(user.uid, deleteConfirmation.item.id);
      setTeams(teams.filter(t => (t as any).id !== deleteConfirmation.item!.id));
      setDeleteConfirmation({ type: 'team', isOpen: false, item: null });
    } catch (error) {
      console.error('Error deleting team');
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!isValidImageFile(file)) {
        showError('Invalid File', 'Please select a valid image file (JPEG, PNG, or WebP)');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showError('File Too Large', 'Please select an image under 10MB');
        return;
      }

      setTeamForm({
        ...teamForm,
        logoFile: file,
        logoPreview: URL.createObjectURL(file),
        originalSize: file.size
      });
    }
  };

  const handleSaveTeam = async () => {
    if (!user || !teamForm.name.trim() || !teamForm.alias.trim()) {
      showError('Missing Information', 'Please enter both team name and alias');
      return;
    }
    
    // Validation
    if (teamForm.name.trim().length > 20) {
      showError('Name Too Long', 'Team name must be 20 characters or less');
      return;
    }
    
    if (teamForm.alias.trim().length > 3) {
      showError('Alias Too Long', 'Team alias must be 3 characters or less');
      return;
    }
    
    setUploading(true);
    try {
      let logoUrl = selectedTeam?.logo || '';
      
      // Handle logo upload/replacement
      if (teamForm.logoFile) {
        if (selectedTeam) {
          // Editing existing team
          logoUrl = await firestoreService.replaceTeamLogo(
            user.uid,
            selectedTeam.name,
            teamForm.name,
            teamForm.logoFile,
            selectedTeam.logo
          );
        } else {
          // Creating new team
          logoUrl = await firestoreService.uploadTeamLogo(
            user.uid,
            teamForm.name,
            teamForm.logoFile
          );
        }
      }

      const teamData: Omit<Team, 'createdAt'> = {
        name: teamForm.name.trim(),
        alias: teamForm.alias.trim(),
        logo: logoUrl,
        players: players
      };

      if (selectedTeam) {
        // Update existing team
        await firestoreService.updateUserTeam(user.uid, (selectedTeam as any).id, teamData);
        setTeams(teams.map(t => 
          (t as any).id === (selectedTeam as any).id 
            ? { ...teamData, id: (selectedTeam as any).id, createdAt: selectedTeam.createdAt }
            : t
        ));
      } else {
        // Create new team
        await firestoreService.addUserTeam(user.uid, teamData);
        const updatedTeams = await firestoreService.getUserTeams(user.uid);
        setTeams(updatedTeams);
      }

      setIsModalOpen(false);
      setTeamForm({
        name: '',
        alias: '',
        logoFile: null,
        logoPreview: null,
        originalSize: null
      });
      setPlayers([]);
    } catch (error) {
      console.error('Error saving team');
    } finally {
      setUploading(false);
    }
  };

  // Player management functions
  const handleAddPlayer = () => {
    setEditingPlayer(null);
    setPlayerForm({ number: '', playerName: '' });
    setShowPlayerForm(true);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setPlayerForm({ number: player.number.toString(), playerName: player.playerName });
    setShowPlayerForm(true);
  };

  const handleDeletePlayer = (playerNumber: number, playerName: string) => {
    setDeleteConfirmation({
      type: 'player',
      isOpen: true,
      item: { id: playerNumber.toString(), name: playerName }
    });
  };

  const confirmDeletePlayer = () => {
    if (!deleteConfirmation.item) return;
    
    const playerNumber = parseInt(deleteConfirmation.item.id);
    setPlayers(players.filter(p => p.number !== playerNumber));
    setDeleteConfirmation({ type: 'player', isOpen: false, item: null });
  };

  const handleSavePlayer = () => {
    const number = parseInt(playerForm.number);
    
    // Validation
    if (!playerForm.playerName.trim() || isNaN(number) || number < 1 || number > 99) {
      showError('Invalid Player Data', 'Please enter a valid player name and number (1-99)');
      return;
    }
    
    if (playerForm.playerName.trim().length > 15) {
      showError('Name Too Long', 'Player name must be 15 characters or less');
      return;
    }
    
    if (!editingPlayer && players.length >= 15) {
      showWarning('Team Full', 'Maximum 15 players allowed per team');
      return;
    }
    
    if (editingPlayer) {
      // Update existing player
      setPlayers(players.map(p => 
        p.number === editingPlayer.number 
          ? { number, playerName: playerForm.playerName.trim() }
          : p
      ));
    } else {
      // Add new player
      if (players.some(p => p.number === number)) {
        showError('Duplicate Number', 'Player number already exists');
        return;
      }
      setPlayers([...players, { number, playerName: playerForm.playerName.trim() }]);
    }
    
    setEditingPlayer(null);
    setPlayerForm({ number: '', playerName: '' });
    setShowPlayerForm(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your teams...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Please log in to view your teams.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('teams.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your teams and players
          </p>
        </div>
        <button
          onClick={handleAddTeam}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>{t('teams.addTeam')}</span>
        </button>
      </motion.div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {teams.map((team, index) => (
          <motion.div
            key={team.alias}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            {/* Team Header */}
            <div className="relative">
              <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                {team.logo ? (
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <Users className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
              </div>
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={() => handleEditTeam(team)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Edit className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => handleDeleteTeam((team as any).id, team.name)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-red-500/50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Team Content */}
            <div className="p-6 pt-12">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {team.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {team.alias}
                </p>
                <div className="flex items-center justify-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-1" />
                  Created {formatDate(team.createdAt)}
                </div>
              </div>

              {/* Players */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  {t('teams.players')} ({team.players.length})
                </h4>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {team.players.map((player) => (
                    <div
                      key={player.number}
                      className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {player.number}
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white truncate">
                        {player.playerName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {teams.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No teams yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first team to get started
          </p>
          <button
            onClick={handleAddTeam}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            {t('teams.addTeam')}
          </button>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation.isOpen && deleteConfirmation.item && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
            onClick={() => setDeleteConfirmation({ type: 'team', isOpen: false, item: null })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Delete {deleteConfirmation.type === 'team' ? 'Team' : 'Player'}
                    </h2>
                    <p className="text-red-100">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Are you sure you want to delete the {deleteConfirmation.type} "
                  <span className="font-semibold">{deleteConfirmation.item.name}</span>"?
                  {deleteConfirmation.type === 'team' && (
                    <span className="block mt-2 text-sm text-gray-600 dark:text-gray-400">
                      This will permanently remove the team, all players, and the team logo.
                    </span>
                  )}
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={deleteConfirmation.type === 'team' ? confirmDeleteTeam : confirmDeletePlayer}
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete {deleteConfirmation.type === 'team' ? 'Team' : 'Player'}</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirmation({ type: 'team', isOpen: false, item: null })}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team Edit/Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedTeam ? 'Edit Team' : 'Create New Team'}
                    </h2>
                    <p className="text-blue-100">Manage your team details and players</p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Team Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Team Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Team Name *
                      </label>
                      <input
                        type="text"
                        value={teamForm.name}
                        onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value.slice(0, 20) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter team name"
                        maxLength={20}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {teamForm.name.length}/20 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Team Alias *
                      </label>
                      <input
                        type="text"
                        value={teamForm.alias}
                        onChange={(e) => setTeamForm({ ...teamForm, alias: e.target.value.slice(0, 3).toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter team alias"
                        maxLength={3}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {teamForm.alias.length}/3 characters (uppercase)
                      </p>
                    </div>

                    {/* Logo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Team Logo
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                          {teamForm.logoPreview ? (
                            <img
                              src={teamForm.logoPreview}
                              alt="Logo preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Camera className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <input
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={handleLogoUpload}
                            className="hidden"
                            id="logo-upload"
                          />
                          <label
                            htmlFor="logo-upload"
                            className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Upload Logo</span>
                          </label>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-1">
                            <p>JPG, PNG, or WebP, max 10MB</p>
                            {teamForm.originalSize && (
                              <p className="text-blue-600 dark:text-blue-400">
                                Original: {formatFileSize(teamForm.originalSize)} → Will be compressed to ~150KB
                              </p>
                            )}
                            <p className="text-green-600 dark:text-green-400">
                              Images are automatically compressed to save storage
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Players */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Players ({players.length}/15)
                      </h3>
                      <button
                        onClick={handleAddPlayer}
                        disabled={players.length >= 15}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Player</span>
                      </button>
                    </div>
                    {players.length >= 15 && (
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        Maximum of 15 players reached
                      </p>
                    )}

                    {/* Player Form */}
                    {showPlayerForm && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {editingPlayer ? 'Edit Player' : 'Add New Player'}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Number *
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="99"
                              value={playerForm.number}
                              onChange={(e) => {
                                const num = e.target.value.slice(0, 2);
                                setPlayerForm({ ...playerForm, number: num });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                              placeholder="1-99"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Name *
                            </label>
                            <input
                              type="text"
                              value={playerForm.playerName}
                              onChange={(e) => setPlayerForm({ ...playerForm, playerName: e.target.value.slice(0, 15) })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                              placeholder="Player name"
                              maxLength={15}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {playerForm.playerName.length}/15 characters
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSavePlayer}
                            disabled={!playerForm.playerName || !playerForm.number}
                            className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Save className="w-4 h-4" />
                            <span>Save Player</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingPlayer(null);
                              setPlayerForm({ number: '', playerName: '' });
                              setShowPlayerForm(false);
                            }}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Players List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {players.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No players added yet. Click "Add Player" to get started.
                        </div>
                      ) : (
                        players.sort((a, b) => a.number - b.number).map((player) => (
                          <div
                            key={player.number}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {player.number}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {player.playerName}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditPlayer(player)}
                                className="p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePlayer(player.number, player.playerName)}
                                className="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={handleSaveTeam}
                    disabled={!teamForm.name || !teamForm.alias || uploading}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    <span>{uploading ? 'Saving...' : (selectedTeam ? 'Update Team' : 'Create Team')}</span>
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    disabled={uploading}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Teams;