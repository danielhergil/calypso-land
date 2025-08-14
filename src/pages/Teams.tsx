import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Users, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Team } from '../types';

const Teams: React.FC = () => {
  const { t } = useTranslation();
  
  // Mock data - replace with real data from Firestore
  const [teams, setTeams] = useState<Team[]>([
    {
      alias: "TM2",
      createdAt: "2025-06-22T21:19:27Z",
      logo: "https://firebasestorage.googleapis.com/v0/b/calypsoapp-60ee9.firebasestorage.app/o/c4K9X4gCBngUHNCwSkuuTyeUnRo1%2FTEAM%202.jpeg?alt=media&token=5094d09f-ef5b-4704-9adc-b6664f2007cc",
      name: "TEAM 2",
      players: [
        { number: 1, playerName: "PLAYER" },
        { number: 2, playerName: "PLAYER" },
        { number: 3, playerName: "PLAYER" },
        { number: 4, playerName: "PLAYER" },
        { number: 5, playerName: "PLAYER" },
        { number: 6, playerName: "PLAYER" },
        { number: 7, playerName: "PLAYER" },
        { number: 8, playerName: "PLAYER" }
      ]
    }
  ]);

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddTeam = () => {
    setSelectedTeam(null);
    setIsModalOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsModalOpen(true);
  };

  const handleDeleteTeam = (alias: string) => {
    setTeams(teams.filter(t => t.alias !== alias));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

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
                  onClick={() => handleDeleteTeam(team.alias)}
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
    </div>
  );
};

export default Teams;