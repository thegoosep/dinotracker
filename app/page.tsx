'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import styled from 'styled-components';
import GlobalStyles from '@/styles/GlobalStyles';
import { Radar, LogOut, Settings, ExternalLink, Hash, RefreshCw, Plus, X, ChevronDown, Edit2 } from 'lucide-react';
import { ALL_SPECIES } from '@/lib/species';

const Container = styled.div`
  min-height: 100vh;
  position: relative;
  padding: ${props => props.theme.spacing.xl};
  padding-bottom: 100px;
`;

const Content = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding-top: ${props => props.theme.spacing.xl};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing['2xl']};
  padding: ${props => props.theme.spacing.xl};
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%);
  backdrop-filter: blur(10px);
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 2px solid rgba(168, 85, 247, 0.5);
`;

const Title = styled.h1`
  font-size: ${props => props.theme.fontSizes['3xl']};
  font-weight: 800;
  color: white;
  margin: 0;
`;

const Section = styled.div`
  background: rgba(10, 10, 10, 0.8);
  backdrop-filter: blur(10px);
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.surfaceLight};
  padding: ${props => props.theme.spacing.xl};
`;



// Shared styled components
const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const FormLabel = styled.label`
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: 600;
`;

const FormInput = styled.input`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: rgba(30, 30, 30, 0.6);
  border: 1px solid ${props => props.theme.colors.surfaceLight};
  border-radius: ${props => props.theme.borderRadius.sm};
  color: white;
  font-size: ${props => props.theme.fontSizes.md};
  transition: all ${props => props.theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: #a855f7;
    background: rgba(30, 30, 30, 0.8);
  }
`;

const FormSelect = styled.select`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: rgba(30, 30, 30, 0.6);
  border: 1px solid ${props => props.theme.colors.surfaceLight};
  border-radius: ${props => props.theme.borderRadius.sm};
  color: white;
  font-size: ${props => props.theme.fontSizes.md};
  transition: all ${props => props.theme.transitions.fast};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #a855f7;
    background: rgba(30, 30, 30, 0.8);
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const CreateButton = styled.button`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%);
  border: 2px solid rgba(168, 85, 247, 0.6);
  color: white;
  font-weight: 700;
  font-size: ${props => props.theme.fontSizes.md};
  cursor: pointer;
  border-radius: ${props => props.theme.borderRadius.md};
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.5) 0%, rgba(236, 72, 153, 0.5) 100%);
    border-color: rgba(168, 85, 247, 1);
    transform: translateY(-2px);
  }
`;

const FilterButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
`;

const FilterButton = styled.button<{ $active: boolean }>`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.$active
    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)'
    : 'transparent'};
  border: 2px solid ${props => props.$active ? '#a855f7' : props.theme.colors.surfaceLight};
  color: ${props => props.$active ? 'white' : props.theme.colors.textSecondary};
  font-weight: 600;
  font-size: ${props => props.theme.fontSizes.sm};
  cursor: pointer;
  border-radius: ${props => props.theme.borderRadius.md};
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    color: white;
    border-color: #a855f7;
  }
`;

const EmptyState = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  text-align: center;
  padding: ${props => props.theme.spacing['2xl']} 0;
  font-size: ${props => props.theme.fontSizes.lg};
`;

const SaveStatus = styled.span<{ $type: 'success' | 'error' }>`
  color: ${props => props.$type === 'success' ? '#10b981' : '#ef4444'};
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: 600;
`;

const TableHeader = styled.th`
  text-align: left;
  padding: ${props => props.theme.spacing.md};
  border-bottom: 2px solid ${props => props.theme.colors.surfaceLight};
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: 600;
  text-transform: uppercase;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid ${props => props.theme.colors.surfaceLight};
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    background: rgba(168, 85, 247, 0.05);
  }
`;

const TableCell = styled.td`
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.fontSizes.sm};
`;

// Monitor styled components
const MonitorContainer = styled.div``;

const MonitorGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.xl};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const MonitorCard = styled.div`
  background: rgba(20, 20, 20, 0.6);
  border: 1px solid ${props => props.theme.colors.surfaceLight};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
`;

const MonitorCardTitle = styled.h3`
  color: white;
  font-size: ${props => props.theme.fontSizes.lg};
  font-weight: 700;
  margin: 0 0 ${props => props.theme.spacing.md} 0;
`;

const FetchButton = styled.button`
  padding: 6px 14px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.5);
  color: #3b82f6;
  font-weight: 600;
  font-size: ${props => props.theme.fontSizes.sm};
  cursor: pointer;
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: all ${props => props.theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    background: rgba(59, 130, 246, 0.4);
    border-color: rgba(59, 130, 246, 0.8);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ServerCheckboxLabel = styled.label<{ $checked: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: 8px 12px;
  background: ${props => props.$checked
    ? 'rgba(168, 85, 247, 0.15)'
    : 'rgba(30, 30, 30, 0.4)'};
  border: 1px solid ${props => props.$checked
    ? 'rgba(168, 85, 247, 0.5)'
    : props.theme.colors.surfaceLight};
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    border-color: rgba(168, 85, 247, 0.5);
  }

  input { accent-color: #a855f7; }
`;

const ServerName = styled.span<{ $checked: boolean }>`
  color: ${props => props.$checked ? 'white' : props.theme.colors.textSecondary};
  font-weight: 600;
  font-size: ${props => props.theme.fontSizes.sm};
  flex: 1;
`;

const ServerStatus = styled.span<{ $status: string }>`
  font-size: ${props => props.theme.fontSizes.xs};
  padding: 2px 8px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-weight: 600;
  background: ${props => props.$status === 'started' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)'};
  color: ${props => props.$status === 'started' ? '#10b981' : '#fbbf24'};
`;

const ServersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
`;

const SpeciesThresholdGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 4px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const SpeciesRow = styled.div<{ $enabled: boolean }>`
  display: grid;
  grid-template-columns: auto 1fr 90px 90px;
  gap: 8px;
  align-items: center;
  padding: 6px 10px;
  background: ${props => props.$enabled
    ? 'rgba(168, 85, 247, 0.1)'
    : 'rgba(30, 30, 30, 0.3)'};
  border: 1px solid ${props => props.$enabled
    ? 'rgba(168, 85, 247, 0.3)'
    : 'transparent'};
  border-radius: 4px;
  transition: all 0.15s ease;

  input[type="checkbox"] { accent-color: #a855f7; }
`;

const SpeciesName = styled.span<{ $enabled: boolean }>`
  color: ${props => props.$enabled ? 'white' : props.theme.colors.textSecondary};
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: 500;
`;

const ThresholdInput = styled(FormInput)`
  flex: 1;
  min-width: 0;
  padding: 4px 6px;
  font-size: 0.8rem;
  text-align: center;

  &:disabled {
    opacity: 0.3;
  }
`;

const ThresholdCell = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
`;

const VoidToggle = styled.button<{ $voided: boolean }>`
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$voided ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 100, 100, 0.2)'};
  border: 1px solid ${props => props.$voided ? 'rgba(239, 68, 68, 0.3)' : 'rgba(100, 100, 100, 0.3)'};
  border-radius: 3px;
  color: ${props => props.$voided ? '#ef4444' : '#6b7280'};
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;

  &:hover {
    background: ${props => props.$voided ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.1)'};
    color: #ef4444;
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
`;

const ThresholdHeader = styled.div`
  display: grid;
  grid-template-columns: auto 1fr 90px 90px;
  gap: 8px;
  padding: 0 10px 8px;
  border-bottom: 1px solid ${props => props.theme.colors.surfaceLight};
  margin-bottom: 8px;
`;

const ThresholdHeaderLabel = styled.span`
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.fontSizes.xs};
  font-weight: 700;
  text-transform: uppercase;
  text-align: center;
`;

const ResultsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const HighStat = styled.span<{ $high: boolean }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
  background: ${props => props.$high ? 'rgba(16, 185, 129, 0.2)' : 'transparent'};
  color: ${props => props.$high ? '#10b981' : 'inherit'};
  ${props => props.$high && 'border: 1px solid rgba(16, 185, 129, 0.4);'}
`;

const LocationText = styled.span`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.textSecondary};
  font-family: monospace;
`;

const LoadMoreButton = styled.button`
  display: block;
  margin: 16px auto 0;
  padding: 8px 24px;
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.4);
  color: white;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(168, 85, 247, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;



const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoginCard = styled.div`
  background: rgba(10, 10, 10, 0.9);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(168, 85, 247, 0.4);
  border-radius: 16px;
  padding: 48px;
  text-align: center;
  max-width: 400px;
  width: 100%;
`;

const LoginTitle = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  color: white;
  margin: 16px 0 8px;
`;

const LoginSubtitle = styled.p`
  color: #9ca3af;
  margin: 0 0 32px;
  font-size: 0.95rem;
`;

const DiscordButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 24px;
  background: #5865F2;
  border: none;
  color: white;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #4752C4;
    transform: translateY(-1px);
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UserAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(168, 85, 247, 0.5);
`;

const UserName = styled.span`
  color: #d1d5db;
  font-size: 0.875rem;
  font-weight: 600;
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.3);
  }
`;

// --- Setup Wizard Styled Components ---

const WizardCard = styled.div`
  background: rgba(10, 10, 10, 0.9);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(168, 85, 247, 0.4);
  border-radius: 16px;
  padding: 48px;
  max-width: 560px;
  width: 100%;
`;

const WizardSteps = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
`;

const StepIndicator = styled.div<{ $active: boolean; $completed: boolean }>`
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: ${props =>
    props.$completed ? '#a855f7' :
    props.$active ? 'rgba(168, 85, 247, 0.5)' :
    'rgba(100, 100, 100, 0.3)'};
  transition: background 0.3s ease;
`;

const WizardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 8px;
`;

const WizardSubtitle = styled.p`
  color: #9ca3af;
  font-size: 0.9rem;
  margin: 0 0 24px;
`;

const GuildList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
`;

const GuildItem = styled.button<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${props => props.$selected
    ? 'rgba(168, 85, 247, 0.2)' : 'rgba(30, 30, 30, 0.6)'};
  border: 1px solid ${props => props.$selected
    ? 'rgba(168, 85, 247, 0.6)' : 'rgba(100, 100, 100, 0.3)'};
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
  font-size: 0.95rem;

  &:hover {
    border-color: rgba(168, 85, 247, 0.5);
    background: rgba(168, 85, 247, 0.1);
  }
`;

const GuildIcon = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
`;

const GuildIconPlaceholder = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(168, 85, 247, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1rem;
`;

const GuildName = styled.span`
  flex: 1;
  font-weight: 600;
`;


const InviteSection = styled.div`
  text-align: center;
  padding: 24px 0;
`;

const InviteLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: #5865F2;
  color: white;
  font-weight: 700;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
  font-size: 0.95rem;

  &:hover {
    background: #4752C4;
    transform: translateY(-1px);
  }
`;


const ChannelList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ChannelItem = styled.button<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: ${props => props.$selected
    ? 'rgba(168, 85, 247, 0.2)' : 'rgba(30, 30, 30, 0.6)'};
  border: 1px solid ${props => props.$selected
    ? 'rgba(168, 85, 247, 0.6)' : 'rgba(100, 100, 100, 0.3)'};
  border-radius: 8px;
  color: white;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: all 0.2s ease;
  font-size: 0.95rem;

  &:hover {
    border-color: rgba(168, 85, 247, 0.5);
  }
`;

const WizardButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%);
  border: 2px solid rgba(168, 85, 247, 0.6);
  color: white;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  width: 100%;
  margin-top: 16px;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.5) 0%, rgba(236, 72, 153, 0.5) 100%);
    border-color: rgba(168, 85, 247, 1);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const WizardError = styled.p`
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 12px;
  text-align: center;
`;

const ServerDropdown = styled.div`
  position: relative;
  margin-left: auto;
  z-index: 9999;
`;

const ServerDropdownToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
  color: #a855f7;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(168, 85, 247, 0.3);
  }
`;

const ServerDropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: rgba(15, 15, 15, 0.98);
  border: 1px solid rgba(168, 85, 247, 0.4);
  border-radius: 8px;
  padding: 6px;
  min-width: 300px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 9999;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 3px;
  }
`;

const ChannelPickerPanel = styled.div`
  position: absolute;
  right: calc(100% + 8px);
  top: 0;
  background: rgba(15, 15, 15, 0.98);
  border: 1px solid rgba(168, 85, 247, 0.4);
  border-radius: 8px;
  padding: 8px;
  min-width: 240px;
  max-height: 320px;
  overflow-y: auto;
  z-index: 101;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 3px;
  }
`;

const ChannelPickerTitle = styled.div`
  color: #9ca3af;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 8px 8px;
  border-bottom: 1px solid rgba(100, 100, 100, 0.2);
  margin-bottom: 4px;
`;

const ChannelPickerItem = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: ${props => props.$active ? 'rgba(168, 85, 247, 0.15)' : 'transparent'};
  border: 1px solid ${props => props.$active ? 'rgba(168, 85, 247, 0.4)' : 'transparent'};
  border-radius: 6px;
  color: ${props => props.$active ? '#a855f7' : '#d1d5db'};
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(168, 85, 247, 0.2);
    color: white;
  }
`;

const ServerDropdownItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  color: #d1d5db;
  font-size: 0.8rem;
  font-weight: 600;
`;

const ServerRemoveBtn = styled.button`
  display: flex;
  align-items: center;
  margin-left: auto;
  padding: 2px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;

  &:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.15);
  }
`;

const AddServerBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px 10px;
  background: none;
  border: 1px dashed rgba(168, 85, 247, 0.3);
  color: #a855f7;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
  margin-top: 4px;

  &:hover {
    background: rgba(168, 85, 247, 0.1);
    border-color: rgba(168, 85, 247, 0.5);
  }
`;

const ColorSwatch = styled.div<{ $color: string }>`
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: ${props => props.$color};
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
`;

const ColorPickerWrapper = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  position: relative;

  input[type="color"] {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
    pointer-events: none;
  }
`;

// --- Setup Wizard Component ---

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
}

interface ForumChannel {
  id: string;
  name: string;
}

interface DiscordServerConfig {
  guild_id: string;
  guild_name: string;
  forum_channel_id: string;
  forum_channel_name: string;
  embed_color?: string;
  nitrado_token?: string;
  servers?: Array<{ service_id: string; name: string }>;
  species_thresholds?: Record<string, { hp: number | null; melee: number | null }>;
}

function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<'guilds' | 'channels'>('guilds');
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [channels, setChannels] = useState<ForumChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ForumChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [error, setError] = useState('');
  const [needsBot, setNeedsBot] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '';

  useEffect(() => {
    fetchGuilds();
  }, []);

  const fetchGuilds = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch('/api/discord/guilds');
      if (resp.status === 403) {
        setError('Session needs updated permissions. Please sign out and sign in again.');
        setLoading(false);
        return;
      }
      if (!resp.ok) {
        setError('Failed to fetch your Discord servers');
        setLoading(false);
        return;
      }
      const data = await resp.json();
      setGuilds(data.guilds || []);
    } catch {
      setError('Failed to connect to Discord');
    }
    setLoading(false);
  };

  const handleGuildSelect = async (guild: Guild) => {
    setSelectedGuild(guild);
    setError('');
    setNeedsBot(false);
    setStep('channels');
    fetchChannels(guild.id);
  };

  const fetchChannels = async (guildId: string) => {
    setLoading(true);
    setError('');
    setNeedsBot(false);
    try {
      const resp = await fetch(`/api/discord/guilds/${guildId}/channels`);
      if (resp.status === 403) {
        setNeedsBot(true);
        setError('Bot needs to be added to this server first.');
        setLoading(false);
        return;
      }
      if (!resp.ok) {
        setError('Failed to fetch channels');
        setLoading(false);
        return;
      }
      const data = await resp.json();
      setChannels(data.channels || []);
      if (data.channels?.length === 0) {
        setError('No forum channels found.');
      }
    } catch {
      setError('Failed to fetch channels');
    }
    setLoading(false);
  };

  const createForumChannel = async () => {
    if (!selectedGuild) return;
    setCreatingChannel(true);
    setError('');
    try {
      const resp = await fetch(`/api/discord/guilds/${selectedGuild.id}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'dino-alerts' }),
      });
      if (!resp.ok) {
        const data = await resp.json();
        setError(data.error || 'Failed to create channel');
        setCreatingChannel(false);
        return;
      }
      // Refresh channel list
      await fetchChannels(selectedGuild.id);
    } catch {
      setError('Failed to create channel');
    }
    setCreatingChannel(false);
  };

  const handleFinish = async () => {
    if (!selectedGuild || !selectedChannel) return;
    setSaving(true);
    setError('');
    try {
      const configResp = await fetch('/api/admin/dino-monitor');
      const configData = await configResp.json();
      const currentConfig = configData.config || {};

      const existingServers: DiscordServerConfig[] = currentConfig.discord_servers || [];
      const filtered = existingServers.filter((s: DiscordServerConfig) => s.guild_id !== selectedGuild.id);
      const newServer: DiscordServerConfig = {
        guild_id: selectedGuild.id,
        guild_name: selectedGuild.name,
        forum_channel_id: selectedChannel.id,
        forum_channel_name: selectedChannel.name,
      };

      await fetch('/api/admin/dino-monitor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentConfig,
          discord_servers: [...filtered, newServer],
        }),
      });
      onComplete();
    } catch {
      setError('Failed to save configuration');
    }
    setSaving(false);
  };

  const botInviteUrl = selectedGuild
    ? `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot&guild_id=${selectedGuild.id}`
    : '';

  return (
    <LoginContainer>
      <GlobalStyles />
      <WizardCard>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Radar size={40} color="#a855f7" />
        </div>

        <WizardSteps>
          <StepIndicator $active={step === 'guilds'} $completed={step === 'channels'} />
          <StepIndicator $active={step === 'channels'} $completed={false} />
        </WizardSteps>

        {step === 'guilds' && (
          <>
            <WizardTitle>Select a Server</WizardTitle>
            <WizardSubtitle>Choose the Discord server for dino alerts</WizardSubtitle>
            {loading ? (
              <div style={{ color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>Loading your servers...</div>
            ) : (
              <GuildList>
                {guilds.map(guild => (
                  <GuildItem key={guild.id} onClick={() => handleGuildSelect(guild)}>
                    {guild.icon ? (
                      <GuildIcon src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=80`} alt="" />
                    ) : (
                      <GuildIconPlaceholder>{guild.name.charAt(0)}</GuildIconPlaceholder>
                    )}
                    <GuildName>{guild.name}</GuildName>
                  </GuildItem>
                ))}
                {guilds.length === 0 && !error && (
                  <div style={{ color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>
                    No servers found where you have manage permissions
                  </div>
                )}
              </GuildList>
            )}
          </>
        )}

        {step === 'channels' && selectedGuild && (
          <>
            <WizardTitle>Select Forum Channel</WizardTitle>
            <WizardSubtitle>Pick the forum channel in <strong style={{ color: 'white' }}>{selectedGuild.name}</strong> for dino alerts</WizardSubtitle>
            {loading ? (
              <div style={{ color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>Loading channels...</div>
            ) : (
              <>
                <InviteLink href={botInviteUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', width: '100%', justifyContent: 'center', marginBottom: 16 }}>
                  <ExternalLink size={18} />
                  Add Bot to {selectedGuild.name}
                </InviteLink>
                {needsBot && (
                  <WizardButton onClick={() => fetchChannels(selectedGuild.id)} style={{ marginBottom: 16 }}>
                    <RefreshCw size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                    Refresh Channels
                  </WizardButton>
                )}
                {!needsBot && (
                  <>
                    <ChannelList>
                      {channels.map(ch => (
                        <ChannelItem
                          key={ch.id}
                          $selected={selectedChannel?.id === ch.id}
                          onClick={() => setSelectedChannel(ch)}
                        >
                          <Hash size={18} color="#9ca3af" />
                          <span style={{ fontWeight: 600 }}>{ch.name}</span>
                        </ChannelItem>
                      ))}
                    </ChannelList>
                    <WizardButton
                      disabled={creatingChannel}
                      onClick={createForumChannel}
                      style={{ marginTop: 12, background: 'rgba(30, 30, 30, 0.6)', borderColor: 'rgba(100, 100, 100, 0.4)' }}
                    >
                      <Plus size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                      {creatingChannel ? 'Creating...' : 'Create Forum Channel'}
                    </WizardButton>
                    <WizardButton
                      disabled={!selectedChannel || saving}
                      onClick={handleFinish}
                    >
                      {saving ? 'Saving...' : 'Continue to Dashboard'}
                    </WizardButton>
                  </>
                )}
              </>
            )}
            <GuildItem onClick={() => { setStep('guilds'); setSelectedGuild(null); setSelectedChannel(null); setNeedsBot(false); setError(''); }} style={{ marginTop: 8 }}>
              <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Back to server list</span>
            </GuildItem>
          </>
        )}

        {error && <WizardError>{error}</WizardError>}
      </WizardCard>
    </LoginContainer>
  );
}

// --- Main Page ---

export default function DinoTrackerPage() {
  const { data: session, status } = useSession();
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [discordServers, setDiscordServers] = useState<DiscordServerConfig[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false);
  const [editingGuildId, setEditingGuildId] = useState<string | null>(null);
  const [editChannels, setEditChannels] = useState<ForumChannel[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadConfig = useCallback(() => {
    fetch('/api/admin/dino-monitor')
      .then(r => r.json())
      .then(data => {
        const config = data.config || {};
        const servers = config.discord_servers || [];
        setDiscordServers(servers);
        if (servers.length > 0) {
          setSetupComplete(true);
          setSelectedGuildId(prev => prev || servers[0].guild_id);
        } else {
          setSetupComplete(false);
        }
      })
      .catch(() => setSetupComplete(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    loadConfig();
  }, [session, loadConfig]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setServerDropdownOpen(false);
        setEditingGuildId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const removeDiscordServer = async (guildId: string) => {
    const updated = discordServers.filter(s => s.guild_id !== guildId);
    setDiscordServers(updated);
    try {
      const configResp = await fetch('/api/admin/dino-monitor');
      const configData = await configResp.json();
      await fetch('/api/admin/dino-monitor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...configData.config, discord_servers: updated }),
      });
      if (updated.length === 0) setSetupComplete(false);
    } catch {}
  };

  const startEditChannel = async (guildId: string) => {
    setEditingGuildId(guildId);
    setEditChannels([]);
    setEditLoading(true);
    try {
      const resp = await fetch(`/api/discord/guilds/${guildId}/channels`);
      if (resp.ok) {
        const data = await resp.json();
        setEditChannels(data.channels || []);
      }
    } catch {}
    setEditLoading(false);
  };

  const updateServerChannel = async (guildId: string, channel: ForumChannel) => {
    const updated = discordServers.map(s =>
      s.guild_id === guildId
        ? { ...s, forum_channel_id: channel.id, forum_channel_name: channel.name }
        : s
    );
    setDiscordServers(updated);
    setEditingGuildId(null);
    try {
      const configResp = await fetch('/api/admin/dino-monitor');
      const configData = await configResp.json();
      await fetch('/api/admin/dino-monitor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...configData.config, discord_servers: updated }),
      });
    } catch {}
  };

  const updateServerColor = async (guildId: string, color: string) => {
    const updated = discordServers.map(s =>
      s.guild_id === guildId ? { ...s, embed_color: color } : s
    );
    setDiscordServers(updated);
    try {
      const configResp = await fetch('/api/admin/dino-monitor');
      const configData = await configResp.json();
      await fetch('/api/admin/dino-monitor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...configData.config, discord_servers: updated }),
      });
    } catch {}
  };


  if (status === 'loading') {
    return (
      <LoginContainer>
        <GlobalStyles />
        <div style={{ color: '#9ca3af', fontSize: '1.1rem' }}>Loading...</div>
      </LoginContainer>
    );
  }

  if (!session) {
    return (
      <LoginContainer>
        <GlobalStyles />
        <LoginCard>
          <Radar size={48} color="#a855f7" />
          <LoginTitle>Dino Tracker</LoginTitle>
          <LoginSubtitle>Sign in with Discord to access the dashboard</LoginSubtitle>
          <DiscordButton onClick={() => signIn('discord')}>
            <svg width="20" height="15" viewBox="0 0 71 55" fill="white">
              <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.3 37.3 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 5a.2.2 0 00-.1 0C1.5 18 -.9 30.6.3 43a.2.2 0 000 .2 58.7 58.7 0 0017.7 9 .2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.6 38.6 0 01-5.5-2.6.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 41.8 41.8 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .3 36.3 36.3 0 01-5.5 2.7.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.8.2.2 0 00.3.1A58.5 58.5 0 0070.3 43a.2.2 0 000-.2c1.4-14.4-2.3-26.9-9.8-38a.2.2 0 00-.1 0zM23.7 35.2c-3.3 0-6-3-6-6.7s2.7-6.7 6-6.7c3.4 0 6.1 3 6 6.7 0 3.7-2.6 6.7-6 6.7zm22.2 0c-3.3 0-6-3-6-6.7s2.6-6.7 6-6.7c3.3 0 6 3 6 6.7 0 3.7-2.7 6.7-6 6.7z"/>
            </svg>
            Sign in with Discord
          </DiscordButton>
        </LoginCard>
      </LoginContainer>
    );
  }

  if (setupComplete === null) {
    return (
      <LoginContainer>
        <GlobalStyles />
        <div style={{ color: '#9ca3af', fontSize: '1.1rem' }}>Loading...</div>
      </LoginContainer>
    );
  }

  if (!setupComplete || showWizard) {
    return <SetupWizard onComplete={() => { setShowWizard(false); loadConfig(); }} />;
  }

  return (
    <Container>
      <GlobalStyles />
      <Content>
        <Header>
          <Radar size={40} />
          <Title>Dino Tracker</Title>
          <ServerDropdown ref={dropdownRef}>
            <ServerDropdownToggle onClick={() => setServerDropdownOpen(!serverDropdownOpen)}>
              <Settings size={14} />
              {discordServers.find(s => s.guild_id === selectedGuildId)?.guild_name || `Discord Servers (${discordServers.length})`}
              <ChevronDown size={12} />
            </ServerDropdownToggle>
            {serverDropdownOpen && (
              <ServerDropdownMenu>
                {editingGuildId && (
                  <ChannelPickerPanel>
                    <ChannelPickerTitle>
                      Select Forum Channel — {discordServers.find(s => s.guild_id === editingGuildId)?.guild_name}
                    </ChannelPickerTitle>
                    {editLoading ? (
                      <div style={{ color: '#9ca3af', fontSize: '0.8rem', padding: '12px 8px', textAlign: 'center' }}>Loading channels...</div>
                    ) : editChannels.length === 0 ? (
                      <div style={{ color: '#ef4444', fontSize: '0.8rem', padding: '12px 8px', textAlign: 'center' }}>No forum channels found</div>
                    ) : (
                      editChannels.map(ch => {
                        const currentServer = discordServers.find(s => s.guild_id === editingGuildId);
                        return (
                          <ChannelPickerItem
                            key={ch.id}
                            $active={ch.id === currentServer?.forum_channel_id}
                            onClick={() => updateServerChannel(editingGuildId, ch)}
                          >
                            <Hash size={14} />
                            {ch.name}
                          </ChannelPickerItem>
                        );
                      })
                    )}
                  </ChannelPickerPanel>
                )}
                {discordServers.map(s => (
                  <ServerDropdownItem key={s.guild_id} style={{
                    background: selectedGuildId === s.guild_id ? 'rgba(168,85,247,0.15)' : editingGuildId === s.guild_id ? 'rgba(168,85,247,0.1)' : 'transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    borderLeft: selectedGuildId === s.guild_id ? '2px solid #a855f7' : '2px solid transparent',
                  }} onClick={() => { setSelectedGuildId(s.guild_id); setServerDropdownOpen(false); }}>
                    <ColorPickerWrapper title="Embed color" onClick={e => e.stopPropagation()}>
                      <ColorSwatch $color={s.embed_color || '#a855f7'} />
                      <input
                        type="color"
                        value={s.embed_color || '#a855f7'}
                        onChange={e => updateServerColor(s.guild_id, e.target.value)}
                      />
                    </ColorPickerWrapper>
                    <span style={{ flex: 1 }}>{s.guild_name || s.guild_id}</span>
                    <span style={{ color: '#6b7280', fontSize: '0.7rem' }}>#{s.forum_channel_name || s.forum_channel_id}</span>
                    <ServerRemoveBtn
                      onClick={e => { e.stopPropagation(); editingGuildId === s.guild_id ? setEditingGuildId(null) : startEditChannel(s.guild_id); }}
                      title="Change forum channel"
                      style={editingGuildId === s.guild_id ? { color: '#a855f7', background: 'rgba(168,85,247,0.15)' } : {}}
                    >
                      <Edit2 size={12} />
                    </ServerRemoveBtn>
                    <ServerRemoveBtn onClick={e => { e.stopPropagation(); removeDiscordServer(s.guild_id); }} title="Remove server">
                      <X size={14} />
                    </ServerRemoveBtn>
                  </ServerDropdownItem>
                ))}
                <AddServerBtn onClick={() => { setShowWizard(true); setServerDropdownOpen(false); }}>
                  <Plus size={14} />
                  Add Server
                </AddServerBtn>
              </ServerDropdownMenu>
            )}
          </ServerDropdown>
          <UserInfo>
            {session.user?.image && <UserAvatar src={session.user.image} alt="" />}
            <UserName>{session.user?.name}</UserName>
            <LogoutButton onClick={() => signOut()}>
              <LogOut size={14} />
              Logout
            </LogoutButton>
          </UserInfo>
        </Header>

        <Section>
          <DinoMonitorPanel discordServers={discordServers} setDiscordServers={setDiscordServers} selectedGuildId={selectedGuildId} />
        </Section>
      </Content>
    </Container>
  );
}

function DinoMonitorPanel({ discordServers, setDiscordServers, selectedGuildId }: {
  discordServers: DiscordServerConfig[];
  setDiscordServers: (servers: DiscordServerConfig[]) => void;
  selectedGuildId: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [config, setConfig] = useState({
    discord_webhook_url: '',
    min_points: 35,
    max_level: 180,
  });

  // Helper to get current guild's configuration
  const getCurrentGuildConfig = () => {
    const guild = discordServers.find(s => s.guild_id === selectedGuildId);
    return {
      servers: guild?.servers || [],
      species_thresholds: guild?.species_thresholds || {},
    };
  };

  // Helper to update current guild's configuration
  const updateCurrentGuildConfig = (updates: Partial<Pick<DiscordServerConfig, 'servers' | 'species_thresholds'>>) => {
    if (!selectedGuildId) return;
    setDiscordServers(prev => prev.map(server =>
      server.guild_id === selectedGuildId
        ? { ...server, ...updates }
        : server
    ));
  };

  // Per-guild server fetching
  const [guildAvailableServers, setGuildAvailableServers] = useState<Record<string, Array<{
    service_id: string; name: string; game: string; status: string;
  }>>>({});
  const [fetchingGuild, setFetchingGuild] = useState<string | null>(null);
  const [guildServerError, setGuildServerError] = useState<Record<string, string>>({});

  // Results feed
  const [results, setResults] = useState<any[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [serverFilter, setServerFilter] = useState('');

  useEffect(() => {
    fetchConfig();
    fetchResults();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dino-monitor');
      const data = await response.json();
      if (data.config) {
        // Migration: if global species_thresholds/servers exist, move them to each guild
        let thresholds = data.config.species_thresholds || {};
        if (data.config.species_to_monitor && Object.keys(thresholds).length === 0) {
          const minPts = data.config.min_points || 35;
          for (const id of data.config.species_to_monitor) {
            thresholds[id] = { hp: minPts, melee: minPts };
          }
        }
        const globalServers = data.config.servers || [];

        // Migrate global config to per-guild if needed
        if ((Object.keys(thresholds).length > 0 || globalServers.length > 0) && data.config.discord_servers) {
          const updatedServers = data.config.discord_servers.map((server: DiscordServerConfig) => ({
            ...server,
            species_thresholds: server.species_thresholds || thresholds,
            servers: server.servers || globalServers,
          }));
          setDiscordServers(updatedServers);

          // Save migrated config
          await fetch('/api/admin/dino-monitor', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data.config,
              discord_servers: updatedServers,
              // Clear global values after migration
              species_thresholds: {},
              servers: [],
            }),
          });
        }

        setConfig({
          discord_webhook_url: data.config.discord_webhook_url ?? '',
          min_points: data.config.min_points || 35,
          max_level: data.config.max_level || 180,
        });
      }
    } catch (error) {
      console.error('Failed to fetch monitor config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      setSaveMsg(null);
      const response = await fetch('/api/admin/dino-monitor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, discord_servers: discordServers }),
      });
      if (response.ok) {
        setSaveMsg({ text: 'Config saved!', type: 'success' });
      } else {
        const data = await response.json();
        setSaveMsg({ text: data.error || 'Failed to save', type: 'error' });
      }
    } catch (error) {
      setSaveMsg({ text: 'Failed to save config', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  const fetchGuildServers = async (guildId: string) => {
    const guild = discordServers.find(s => s.guild_id === guildId);
    if (!guild?.nitrado_token) {
      setGuildServerError(prev => ({ ...prev, [guildId]: 'Enter a Nitrado token first' }));
      return;
    }
    try {
      setFetchingGuild(guildId);
      setGuildServerError(prev => ({ ...prev, [guildId]: '' }));
      const response = await fetch('/api/admin/dino-monitor/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nitrado_token: guild.nitrado_token }),
      });
      const data = await response.json();
      if (!response.ok) {
        setGuildServerError(prev => ({ ...prev, [guildId]: data.error || 'Failed to fetch servers' }));
        return;
      }
      setGuildAvailableServers(prev => ({ ...prev, [guildId]: data.servers || [] }));
      if (data.servers?.length === 0) {
        setGuildServerError(prev => ({ ...prev, [guildId]: 'No game servers found for this token' }));
      }
    } catch {
      setGuildServerError(prev => ({ ...prev, [guildId]: 'Failed to fetch servers' }));
    } finally {
      setFetchingGuild(null);
    }
  };

  const toggleServer = (server: { service_id: string; name: string }) => {
    const guildConfig = getCurrentGuildConfig();
    const exists = guildConfig.servers.some(s => s.service_id === server.service_id);
    updateCurrentGuildConfig({
      servers: exists
        ? guildConfig.servers.filter(s => s.service_id !== server.service_id)
        : [...guildConfig.servers, { service_id: server.service_id, name: server.name }],
    });
  };

  const updateGuildToken = (guildId: string, token: string) => {
    const updated = discordServers.map(s =>
      s.guild_id === guildId ? { ...s, nitrado_token: token } : s
    );
    setDiscordServers(updated);
  };


  const toggleSpecies = (speciesId: string) => {
    const guildConfig = getCurrentGuildConfig();
    const newThresholds = { ...guildConfig.species_thresholds };
    if (newThresholds[speciesId]) {
      delete newThresholds[speciesId];
    } else {
      newThresholds[speciesId] = { hp: config.min_points, melee: config.min_points };
    }
    updateCurrentGuildConfig({ species_thresholds: newThresholds });
  };

  const updateThreshold = (speciesId: string, stat: 'hp' | 'melee', value: number) => {
    const guildConfig = getCurrentGuildConfig();
    updateCurrentGuildConfig({
      species_thresholds: {
        ...guildConfig.species_thresholds,
        [speciesId]: {
          ...guildConfig.species_thresholds[speciesId],
          [stat]: value,
        },
      },
    });
  };

  const toggleVoid = (speciesId: string, stat: 'hp' | 'melee') => {
    const guildConfig = getCurrentGuildConfig();
    const threshold = guildConfig.species_thresholds[speciesId];
    if (!threshold) return;
    updateCurrentGuildConfig({
      species_thresholds: {
        ...guildConfig.species_thresholds,
        [speciesId]: {
          ...threshold,
          [stat]: threshold[stat] === null ? config.min_points : null,
        },
      },
    });
  };

  const selectAllSpecies = () => {
    const guildConfig = getCurrentGuildConfig();
    const newThresholds: Record<string, { hp: number | null; melee: number | null }> = {};
    for (const s of ALL_SPECIES) {
      newThresholds[s.id] = guildConfig.species_thresholds[s.id] || { hp: config.min_points, melee: config.min_points };
    }
    updateCurrentGuildConfig({ species_thresholds: newThresholds });
  };

  const clearAllSpecies = () => {
    updateCurrentGuildConfig({ species_thresholds: {} });
  };

  const loadDefaultThresholds = () => {
    const defaults: Record<string, { hp: number | null; melee: number | null }> = {
      Desmodus: { hp: 30, melee: 30 },
      BionicTrike: { hp: 33, melee: null },
      Mantis: { hp: 33, melee: 33 },
      Rhino: { hp: 33, melee: 33 },
      Therizino: { hp: 33, melee: 33 },
      Spino: { hp: 33, melee: 33 },
      Turtle: { hp: 33, melee: null },
      Ptero: { hp: 33, melee: null },
      Owl: { hp: 33, melee: null },
      Spindles: { hp: 29, melee: 29 },
      BionicStego: { hp: 33, melee: null },
      BionicQuetz: { hp: 33, melee: null },
      BionicRex: { hp: 32, melee: null },
      BogSpider: { hp: 32, melee: 32 },
      MilkGlider: { hp: 32, melee: null },
      Gigant: { hp: 32, melee: 32 },
      Tusoteuthis: { hp: 30, melee: 30 },
      Paracer: { hp: 30, melee: null },
    };
    updateCurrentGuildConfig({ species_thresholds: defaults });
    setConfig(prev => ({ ...prev, min_points: 33 }));
  };

  const [testingNotify, setTestingNotify] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const [monitorRunning, setMonitorRunning] = useState(false);
  const [monitorStatus, setMonitorStatus] = useState<any>(null);

  const triggerScan = useCallback(async () => {
    try {
      setScanning(true);
      setScanMsg('Downloading & parsing saves...');
      const response = await fetch('/api/admin/dino-monitor/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (response.ok) {
        setScanMsg(`Scan complete! ${data.servers_scanned} servers, ${data.results} rare dinos found`);
        fetchResults();
      } else {
        setScanMsg(`Scan failed: ${data.error}`);
      }
    } catch (error) {
      setScanMsg('Scan failed');
    } finally {
      setScanning(false);
      setTimeout(() => setScanMsg(null), 10000);
    }
  }, []);

  // Poll monitor status every 5 seconds
  const fetchMonitorStatus = useCallback(async () => {
    try {
      const resp = await fetch('/api/admin/dino-monitor/monitor');
      const data = await resp.json();
      setMonitorStatus(data);
      setMonitorRunning(data.running);
    } catch {}
  }, []);

  useEffect(() => {
    fetchMonitorStatus();
    const id = setInterval(fetchMonitorStatus, 5000);
    return () => clearInterval(id);
  }, [fetchMonitorStatus]);

  const toggleMonitor = async () => {
    try {
      const action = monitorRunning ? 'stop' : 'start';
      const resp = await fetch('/api/admin/dino-monitor/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, interval: 60 }),
      });
      const data = await resp.json();
      if (data.success) {
        setMonitorRunning(action === 'start');
        fetchMonitorStatus();
      }
    } catch (error) {
      setScanMsg('Failed to toggle monitor');
    }
  };

  const testNotification = async () => {
    try {
      setTestingNotify(true);
      const response = await fetch('/api/admin/dino-monitor/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guild_id: selectedGuildId,
          results: [{
            species: 'Rex',
            level: 150,
            hp_points: 45,
            melee_points: 42,
            server_name: config.servers[0]?.name || 'Test Server',
            location: { lat: 50.0, lon: 50.0 },
          }],
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSaveMsg({ text: `Test notification sent! (${data.sent} embed)`, type: 'success' });
      } else {
        setSaveMsg({ text: data.error || 'Failed to send test', type: 'error' });
      }
    } catch (error) {
      setSaveMsg({ text: 'Failed to send test notification', type: 'error' });
    } finally {
      setTestingNotify(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  const fetchResults = async (offset = 0) => {
    try {
      setResultsLoading(true);
      const params = new URLSearchParams({ limit: '50', offset: String(offset) });
      if (speciesFilter) params.set('species', speciesFilter);
      if (serverFilter) params.set('service_id', serverFilter);
      const response = await fetch(`/api/admin/dino-monitor/results?${params}`);
      const data = await response.json();
      if (offset === 0) {
        setResults(data.results || []);
      } else {
        setResults(prev => [...prev, ...(data.results || [])]);
      }
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [speciesFilter, serverFilter]);

  if (loading) {
    return <div style={{ color: 'white' }}>Loading monitor config...</div>;
  }

  const guildConfig = getCurrentGuildConfig();
  const enabledCount = Object.keys(guildConfig.species_thresholds).length;

  return (
    <MonitorContainer>
      <SectionHeader>
        <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
          Dino Monitor Configuration
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {scanMsg && <span style={{ color: '#a855f7', fontSize: '0.875rem', fontWeight: 600 }}>{scanMsg}</span>}
          {monitorRunning && monitorStatus && (
            <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>
              Monitoring — {monitorStatus.scanCount} scans, {monitorStatus.alertCount} alerts
            </span>
          )}
          {saveMsg && <SaveStatus $type={saveMsg.type}>{saveMsg.text}</SaveStatus>}
          <CreateButton onClick={toggleMonitor} style={{ background: monitorRunning ? '#ef4444' : '#22c55e' }}>
            {monitorRunning ? 'Stop Monitor' : 'Start Monitor'}
          </CreateButton>
          <CreateButton onClick={triggerScan} disabled={scanning}>
            {scanning ? 'Scanning...' : 'Scan Now'}
          </CreateButton>
          <CreateButton onClick={saveConfig} disabled={saving}>
            {saving ? 'Saving...' : 'Save Config'}
          </CreateButton>
        </div>
      </SectionHeader>

      <MonitorGrid>
        {/* Scan Settings */}
        <MonitorCard>
          <MonitorCardTitle>Scan Settings</MonitorCardTitle>
          <FormGrid>
            <FormGroup>
              <FormLabel>Default Stat Points</FormLabel>
              <FormInput
                type="number"
                value={config.min_points}
                onChange={(e) => setConfig({ ...config, min_points: parseInt(e.target.value) || 35 })}
                min="1"
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>Max Wild Level</FormLabel>
              <FormInput
                type="number"
                value={config.max_level}
                onChange={(e) => setConfig({ ...config, max_level: parseInt(e.target.value) || 180 })}
                min="1"
              />
            </FormGroup>
          </FormGrid>
          <FormGroup style={{ marginTop: '12px' }}>
            <FormLabel style={{ fontSize: '0.75rem', opacity: 0.6 }}>Discord Webhook URL (fallback)</FormLabel>
            <FormInput
              type="text"
              value={config.discord_webhook_url}
              onChange={(e) => setConfig({ ...config, discord_webhook_url: e.target.value })}
              placeholder="https://discord.com/api/webhooks/..."
              style={{ fontSize: '0.85rem', opacity: 0.7 }}
            />
          </FormGroup>
          <FetchButton onClick={testNotification} disabled={testingNotify} style={{ marginTop: '8px' }}>
            {testingNotify ? 'Sending...' : 'Test Notification'}
          </FetchButton>
        </MonitorCard>
      </MonitorGrid>

      {/* Selected Guild Nitrado Config */}
      {(() => {
        const guild = discordServers.find(s => s.guild_id === selectedGuildId);
        if (!guild) return null;
        const guildServers = guildAvailableServers[guild.guild_id] || [];
        const error = guildServerError[guild.guild_id] || '';
        const isFetching = fetchingGuild === guild.guild_id;
        return (
          <MonitorCard style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <MonitorCardTitle style={{ margin: 0 }}>
                {guild.guild_name || guild.guild_id}
              </MonitorCardTitle>
              <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                #{guild.forum_channel_name || guild.forum_channel_id}
              </span>
            </div>
            <FormGroup style={{ marginBottom: '12px' }}>
              <FormLabel>Nitrado API Token</FormLabel>
              <div style={{ display: 'flex', gap: '8px' }}>
                <FormInput
                  type="password"
                  value={guild.nitrado_token || ''}
                  onChange={(e) => updateGuildToken(guild.guild_id, e.target.value)}
                  placeholder="Enter Nitrado token for this server"
                  style={{ flex: 1 }}
                />
                <FetchButton onClick={() => fetchGuildServers(guild.guild_id)} disabled={isFetching}>
                  {isFetching ? 'Fetching...' : 'Fetch Servers'}
                </FetchButton>
              </div>
            </FormGroup>
            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '8px' }}>{error}</div>
            )}
            {guildServers.length > 0 ? (
              <ServersGrid>
                {guildServers.map(server => {
                  const isSelected = guildConfig.servers.some(s => s.service_id === server.service_id);
                  return (
                    <ServerCheckboxLabel key={server.service_id} $checked={isSelected}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleServer(server)}
                      />
                      <ServerName $checked={isSelected}>{server.name}</ServerName>
                      <ServerStatus $status={server.status}>{server.status}</ServerStatus>
                    </ServerCheckboxLabel>
                  );
                })}
              </ServersGrid>
            ) : !guild.nitrado_token ? (
              <div style={{ color: '#9ca3af', fontSize: '0.8rem', padding: '8px 0' }}>
                Enter a Nitrado token and click Fetch Servers to configure.
              </div>
            ) : null}
          </MonitorCard>
        );
      })()}


      {/* Species Thresholds */}
      <MonitorCard style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <MonitorCardTitle style={{ margin: 0 }}>
            Species Thresholds ({enabledCount} selected)
          </MonitorCardTitle>
          <FilterButtons>
            <FilterButton $active={false} onClick={loadDefaultThresholds}>Load Defaults</FilterButton>
            <FilterButton $active={false} onClick={selectAllSpecies}>Select All</FilterButton>
            <FilterButton $active={false} onClick={clearAllSpecies}>Clear All</FilterButton>
          </FilterButtons>
        </div>
        <ThresholdHeader>
          <span />
          <span />
          <ThresholdHeaderLabel>HP</ThresholdHeaderLabel>
          <ThresholdHeaderLabel>Melee</ThresholdHeaderLabel>
        </ThresholdHeader>
        <SpeciesThresholdGrid>
          {ALL_SPECIES.map(species => {
            const enabled = !!guildConfig.species_thresholds[species.id];
            const thresholds = guildConfig.species_thresholds[species.id] || { hp: config.min_points, melee: config.min_points };
            return (
              <SpeciesRow key={species.id} $enabled={enabled}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => toggleSpecies(species.id)}
                />
                <SpeciesName $enabled={enabled}>{species.name}</SpeciesName>
                <ThresholdCell>
                  {thresholds.hp !== null ? (
                    <>
                      <ThresholdInput
                        type="number"
                        value={thresholds.hp}
                        onChange={(e) => updateThreshold(species.id, 'hp', parseInt(e.target.value) || 0)}
                        disabled={!enabled}
                        min="0"
                      />
                      <VoidToggle $voided={false} disabled={!enabled} onClick={() => toggleVoid(species.id, 'hp')} title="Disable HP monitoring" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }}>✕</VoidToggle>
                    </>
                  ) : (
                    <VoidToggle $voided={true} disabled={!enabled} onClick={() => toggleVoid(species.id, 'hp')} title="Enable HP monitoring" style={{ width: '100%', height: '28px', fontSize: '0.85rem' }}>X</VoidToggle>
                  )}
                </ThresholdCell>
                <ThresholdCell>
                  {thresholds.melee !== null ? (
                    <>
                      <ThresholdInput
                        type="number"
                        value={thresholds.melee}
                        onChange={(e) => updateThreshold(species.id, 'melee', parseInt(e.target.value) || 0)}
                        disabled={!enabled}
                        min="0"
                      />
                      <VoidToggle $voided={false} disabled={!enabled} onClick={() => toggleVoid(species.id, 'melee')} title="Disable Melee monitoring" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }}>✕</VoidToggle>
                    </>
                  ) : (
                    <VoidToggle $voided={true} disabled={!enabled} onClick={() => toggleVoid(species.id, 'melee')} title="Enable Melee monitoring" style={{ width: '100%', height: '28px', fontSize: '0.85rem' }}>X</VoidToggle>
                  )}
                </ThresholdCell>
              </SpeciesRow>
            );
          })}
        </SpeciesThresholdGrid>
      </MonitorCard>

      {/* Scan Results Feed */}
      <MonitorCard style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <MonitorCardTitle style={{ margin: 0 }}>
            Scan Results ({results.length}{hasMore ? '+' : ''})
          </MonitorCardTitle>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <FormSelect
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              style={{ width: 'auto', fontSize: '0.85rem', padding: '4px 8px' }}
            >
              <option value="">All Species</option>
              {ALL_SPECIES.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </FormSelect>
            <FormSelect
              value={serverFilter}
              onChange={(e) => setServerFilter(e.target.value)}
              style={{ width: 'auto', fontSize: '0.85rem', padding: '4px 8px' }}
            >
              <option value="">All Servers</option>
              {config.servers.map(s => (
                <option key={s.service_id} value={s.service_id}>{s.name}</option>
              ))}
            </FormSelect>
            <FetchButton onClick={() => fetchResults()} disabled={resultsLoading}>
              Refresh
            </FetchButton>
          </div>
        </div>

        {resultsLoading && results.length === 0 ? (
          <div style={{ color: 'white' }}>Loading results...</div>
        ) : results.length === 0 ? (
          <EmptyState style={{ padding: '20px 0' }}>
            No scan results yet. Results will appear here as the monitor runs.
          </EmptyState>
        ) : (
          <>
            <ResultsTable>
              <thead>
                <tr>
                  <TableHeader>Time</TableHeader>
                  <TableHeader>Server</TableHeader>
                  <TableHeader>Species</TableHeader>
                  <TableHeader>Level</TableHeader>
                  <TableHeader>HP</TableHeader>
                  <TableHeader>Melee</TableHeader>
                  <TableHeader>Location</TableHeader>
                </tr>
              </thead>
              <tbody>
                {results.map((r: any) => {
                  const th = guildConfig.species_thresholds[r.species];
                  const hpHigh = th ? (th.hp !== null ? r.hp_points >= th.hp : false) : r.hp_points >= config.min_points;
                  const meleeHigh = th ? (th.melee !== null ? r.melee_points >= th.melee : false) : r.melee_points >= config.min_points;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        {r.scanned_at ? new Date(r.scanned_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        }) : '-'}
                      </TableCell>
                      <TableCell>{r.server_name}</TableCell>
                      <TableCell style={{ fontWeight: 600 }}>{r.species}</TableCell>
                      <TableCell>{r.level}</TableCell>
                      <TableCell>
                        <HighStat $high={hpHigh}>{r.hp_points}</HighStat>
                      </TableCell>
                      <TableCell>
                        <HighStat $high={meleeHigh}>{r.melee_points}</HighStat>
                      </TableCell>
                      <TableCell>
                        <LocationText>
                          {r.location ? (r.location.lat !== undefined
                            ? `${r.location.lat}, ${r.location.lon}`
                            : `${Math.round(r.location.x)}, ${Math.round(r.location.y)}`) : '-'}
                        </LocationText>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </ResultsTable>
            {hasMore && (
              <LoadMoreButton
                onClick={() => fetchResults(results.length)}
                disabled={resultsLoading}
              >
                {resultsLoading ? 'Loading...' : 'Load More'}
              </LoadMoreButton>
            )}
          </>
        )}
      </MonitorCard>
    </MonitorContainer>
  );
}
