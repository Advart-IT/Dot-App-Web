'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  updateProfile,
  createProfile,
  deleteProfile,
  addNewContactType,
  type ProfileDetailResponse,
  type UpdateProfileRequest,
  type CreateProfileRequest
} from '@/lib/user/user';
import SmartInputBox from '@/components/custom-ui/input-box';
import { Button } from '@/components/custom-ui/button2';
import SmartDropdown from '@/components/custom-ui/dropdown-with-add';
import { useUser } from '@/hooks/usercontext';
import TagsModal from './tags-modal';

interface UserComponentProps {
  selectedProfile: ProfileDetailResponse | null;
  onProfileUpdate: (profileId: number) => Promise<void>;
  onError: (error: string) => void;
  isCreating?: boolean;
  onProfileCreated?: () => Promise<void>;
  onProfileDeleted?: () => Promise<void>;
}

// Indian states data
const indianStates = [
  { label: "Andhra Pradesh", value: "andhra_pradesh" },
  { label: "Arunachal Pradesh", value: "arunachal_pradesh" },
  { label: "Assam", value: "assam" },
  { label: "Bihar", value: "bihar" },
  { label: "Chhattisgarh", value: "chhattisgarh" },
  { label: "Goa", value: "goa" },
  { label: "Gujarat", value: "gujarat" },
  { label: "Haryana", value: "haryana" },
  { label: "Himachal Pradesh", value: "himachal_pradesh" },
  { label: "Jharkhand", value: "jharkhand" },
  { label: "Karnataka", value: "karnataka" },
  { label: "Kerala", value: "kerala" },
  { label: "Madhya Pradesh", value: "madhya_pradesh" },
  { label: "Maharashtra", value: "maharashtra" },
  { label: "Manipur", value: "manipur" },
  { label: "Meghalaya", value: "meghalaya" },
  { label: "Mizoram", value: "mizoram" },
  { label: "Nagaland", value: "nagaland" },
  { label: "Odisha", value: "odisha" },
  { label: "Punjab", value: "punjab" },
  { label: "Rajasthan", value: "rajasthan" },
  { label: "Sikkim", value: "sikkim" },
  { label: "Tamil Nadu", value: "tamil_nadu" },
  { label: "Telangana", value: "telangana" },
  { label: "Tripura", value: "tripura" },
  { label: "Uttar Pradesh", value: "uttar_pradesh" },
  { label: "Uttarakhand", value: "uttarakhand" },
  { label: "West Bengal", value: "west_bengal" },
  { label: "Delhi", value: "delhi" },
  { label: "Jammu and Kashmir", value: "jammu_kashmir" },
  { label: "Ladakh", value: "ladakh" },
  { label: "Puducherry", value: "puducherry" },
  { label: "Chandigarh", value: "chandigarh" },
  { label: "Dadra and Nagar Haveli and Daman and Diu", value: "dadra_nagar_haveli_daman_diu" },
  { label: "Lakshadweep", value: "lakshadweep" },
  { label: "Andaman and Nicobar Islands", value: "andaman_nicobar" }
];

const addressTypes = [
  { label: "Home", value: "home" },
  { label: "Work", value: "work" }
];

// Default contact types - these will be augmented with user context data
const defaultContactTypes = [
  { label: "Email", value: "Email" },
  { label: "Phone", value: "phone_no" },
  { label: "LinkedIn", value: "LinkedIn" }
];

interface ContactForm {
  type: string;
  value: string;
}

interface AddressForm {
  type: string;
  doorNo: string;
  street: string;
  mainStreet: string;
  city: string;
  state: string;
  pincode: string;
}

export default function UserComponent({
  selectedProfile,
  onProfileUpdate,
  onError,
  isCreating = false,
  onProfileCreated,
  onProfileDeleted
}: UserComponentProps) {
  const { user } = useUser();
  const [saving, setSaving] = useState<boolean>(false);

  // Local state for dynamically added contact types
  const [localContactTypes, setLocalContactTypes] = useState<string[]>([]);

  // Tags modal state
  const [isTagsModalOpen, setIsTagsModalOpen] = useState<boolean>(false);

  // Ref to store the latest selectedProfile to avoid stale closures in callbacks
  const selectedProfileRef = useRef<ProfileDetailResponse | null>(null);
  useEffect(() => {
    selectedProfileRef.current = selectedProfile;
  }, [selectedProfile]);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    name: ''
  });

  // Contact form state - array to handle multiple contacts
  const [contacts, setContacts] = useState<ContactForm[]>([
    {
      type: 'Email',
      value: ''
    }
  ]);

  // Tags state for multi-select dropdown
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Bank details form state
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    upi: ''
  });

  // Address form state - array to handle multiple addresses
  const [addresses, setAddresses] = useState<AddressForm[]>([
    {
      type: 'home',
      doorNo: '',
      street: '',
      mainStreet: '',
      city: '',
      state: '',
      pincode: ''
    }
  ]);

  // Update form when selectedProfile changes - only if it's different from ref
  useEffect(() => {
    // Don't reset form when in create mode
    if (isCreating) {
      return;
    }

    // Prevent resetting state if the profile ID matches the ref, indicating a save just occurred
    if (selectedProfile && selectedProfileRef.current && selectedProfile.profile_id === selectedProfileRef.current.profile_id) {
       // Optional: Log or handle potential update from parent after save
       // console.log("Profile updated from parent after save, potentially resetting UI state.");
       // If you want to reset UI state to match the server after a save, keep the logic below.
       // If you want to keep UI state until next explicit selection change, you might need a flag.
    }

    if (selectedProfile) {
      setEditForm({
        name: selectedProfile.name || ''
      });

      // Parse contacts from selectedProfile
      if (selectedProfile.contact) {
        if (typeof selectedProfile.contact === 'object' && selectedProfile.contact !== null) {
          const contactData = selectedProfile.contact as any;
          const parsedContacts: ContactForm[] = [];

          Object.keys(contactData).forEach(key => {
            const contactValue = contactData[key];
            if (contactValue && typeof contactValue === 'string') {
              parsedContacts.push({
                type: key,
                value: contactValue
              });
            }
          });

          setContacts(parsedContacts.length > 0 ? parsedContacts : [
            { type: 'Email', value: '' }
          ]);
        } else if (typeof selectedProfile.contact === 'string') {
          // If it's a string, try to parse as JSON, otherwise treat as single email
          try {
            const contactData = JSON.parse(selectedProfile.contact);
            const parsedContacts: ContactForm[] = [];

            Object.keys(contactData).forEach(key => {
              const contactValue = contactData[key];
              if (contactValue && typeof contactValue === 'string') {
                parsedContacts.push({
                  type: key,
                  value: contactValue
                });
              }
            });

            setContacts(parsedContacts.length > 0 ? parsedContacts : [
              { type: 'Email', value: '' }
            ]);
          } catch {
            // If parsing fails, treat as single email value
            setContacts([
              { type: 'Email', value: selectedProfile.contact }
            ]);
          }
        } else {
          setContacts([{ type: 'Email', value: '' }]);
        }
      } else {
        setContacts([{ type: 'Email', value: '' }]);
      }

      // Parse bank details from selectedProfile
      if (selectedProfile.details?.bankDetails) {
        if (typeof selectedProfile.details.bankDetails === 'object') {
          const bankData = selectedProfile.details.bankDetails as any;
          setBankDetails({
            accountNumber: bankData.accountNumber || bankData.account_number || '',
            ifscCode: bankData.ifscCode || bankData.ifsc_code || bankData.IFSC || '',
            upi: bankData.upi || bankData.UPI || ''
          });
        } else if (typeof selectedProfile.details.bankDetails === 'string') {
          // Try to parse JSON string, fallback to empty if not parseable
          try {
            const bankData = JSON.parse(selectedProfile.details.bankDetails);
            setBankDetails({
              accountNumber: bankData.accountNumber || bankData.account_number || '',
              ifscCode: bankData.ifscCode || bankData.ifsc_code || bankData.IFSC || '',
              upi: bankData.upi || bankData.UPI || ''
            });
          } catch {
            // If not JSON, reset to empty
            setBankDetails({
              accountNumber: '',
              ifscCode: '',
              upi: ''
            });
          }
        }
      } else {
        // Reset to empty bank details
        setBankDetails({
          accountNumber: '',
          ifscCode: '',
          upi: ''
        });
      }

      // Parse addresses from selectedProfile
      if (selectedProfile.address) {
        if (typeof selectedProfile.address === 'object' && selectedProfile.address !== null) {
          const addressData = selectedProfile.address as any;
          const parsedAddresses: AddressForm[] = [];

          // Convert object format to array format
          Object.keys(addressData).forEach(key => {
            const addr = addressData[key];
            if (typeof addr === 'object' && addr !== null) {
              parsedAddresses.push({
                type: key,
                doorNo: addr.doorNo || addr.door_no || '',
                street: addr.street || '',
                mainStreet: addr.mainStreet || addr.main_street || '',
                city: addr.city || '',
                state: addr.state || '',
                pincode: addr.pincode || addr.zip || ''
              });
            }
          });

          setAddresses(parsedAddresses.length > 0 ? parsedAddresses : [
            { type: 'home', doorNo: '', street: '', mainStreet: '', city: '', state: '', pincode: '' }
          ]);
        } else {
          // Reset to default single address
          setAddresses([
            { type: 'home', doorNo: '', street: '', mainStreet: '', city: '', state: '', pincode: '' }
          ]);
        }
      } else {
        // Reset to default single address
        setAddresses([
          { type: 'home', doorNo: '', street: '', mainStreet: '', city: '', state: '', pincode: '' }
        ]);
      }

      // Parse tags from selectedProfile - tags are stored in the root 'tag' field
      if (selectedProfile.tag) {
        if (Array.isArray(selectedProfile.tag)) {
          setSelectedTags(selectedProfile.tag);
        } else if (typeof selectedProfile.tag === 'string') {
          try {
            const parsedTags = JSON.parse(selectedProfile.tag);
            setSelectedTags(Array.isArray(parsedTags) ? parsedTags : []);
          } catch {
            setSelectedTags([]);
          }
        } else {
          setSelectedTags([]);
        }
      } else {
        setSelectedTags([]);
      }
    }
  }, [selectedProfile, isCreating]); // Only re-run when selectedProfile object *identity* changes or create mode changes

  // Initialize empty form when entering create mode
  useEffect(() => {
    if (isCreating && !selectedProfile) {
      setEditForm({ name: '' });
      setContacts([{ type: 'Email', value: '' }]);
      setAddresses([{ type: 'home', doorNo: '', street: '', mainStreet: '', city: '', state: '', pincode: '' }]);
      setSelectedTags([]);
      setBankDetails({ accountNumber: '', ifscCode: '', upi: '' });
    }
  }, [isCreating, selectedProfile]);

  const handleFormChange = (field: keyof typeof editForm, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Contact management functions
  const handleContactChange = (index: number, field: keyof ContactForm, value: string) => {
    setContacts(prev => {
      const newContacts = [...prev];
      newContacts[index] = { ...newContacts[index], [field]: value };
      return newContacts;
    });
  };

  // Tags management function
  const handleTagsChange = (value: string | string[]) => {
    const tags = Array.isArray(value) ? value : [value];
    setSelectedTags(tags);
    console.log('Tags changed:', tags);
    // Only auto-save if not in create mode
    if (!isCreating) {
      setTimeout(() => handleAutoSaveWithState(contacts, addresses, tags, editForm, bankDetails), 100);
    }
  };

  const addNewContact = () => {
    const newContacts = [...contacts, {
      type: 'Email',
      value: ''
    }];
    setContacts(newContacts);
    console.log('Added new contact, new contacts array:', newContacts);
    // Don't auto-save when adding empty contact - wait for user to enter data
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      const newContacts = contacts.filter((_, i) => i !== index);
      setContacts(newContacts);
      console.log(`Removed contact at index ${index}, new contacts array:`, newContacts);
      // Auto-save immediately when removing contact (this should update the server)
      setTimeout(() => handleAutoSaveWithState(newContacts, addresses, selectedTags, editForm, bankDetails), 100);
    }
  };

  // Address management functions
  const handleAddressChange = (index: number, field: keyof AddressForm, value: string) => {
    setAddresses(prev => {
      const newAddresses = [...prev];
      newAddresses[index] = { ...newAddresses[index], [field]: value };
      return newAddresses;
    });
  };

  const addNewAddress = () => {
    const newAddresses = [...addresses, {
      type: 'home',
      doorNo: '',
      street: '',
      mainStreet: '',
      city: '',
      state: '',
      pincode: ''
    }];
    setAddresses(newAddresses);
    console.log('Added new address, new addresses array:', newAddresses);
    // Don't auto-save when adding empty address - wait for user to enter data
  };

  const removeAddress = (index: number) => {
    if (addresses.length > 1) {
      const newAddresses = addresses.filter((_, i) => i !== index);
      setAddresses(newAddresses);
      console.log(`Removed address at index ${index}, new addresses array:`, newAddresses);
      // Auto-save immediately when removing address (this should update the server)
      setTimeout(() => handleAutoSaveWithState(contacts, newAddresses, selectedTags, editForm, bankDetails), 100);
    }
  };

  // Bank details management functions
  const handleBankDetailsChange = (field: keyof typeof bankDetails, value: string) => {
    setBankDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle opening tags modal
  const handleOpenTagsModal = () => {
    setIsTagsModalOpen(true);
  };

  // Handle closing tags modal
  const handleCloseTagsModal = () => {
    setIsTagsModalOpen(false);
  };

  // Function to add new contact type using the content/dropdown API
  const handleAddNewContact = useCallback(async (newContactType: string) => {
    try {
      console.log('Adding new contact type:', newContactType);
      
      // Use the library API function
      const result = await addNewContactType(newContactType);
      console.log('New contact type added successfully:', result);
      
      // Add the new contact type to local state immediately
      setLocalContactTypes(prev => [...prev, newContactType]);
      
      // Show success message
      alert(`Contact type "${newContactType}" added successfully!`);
      
    } catch (error) {
      console.error('Error adding new contact type:', error);
      onError(error instanceof Error ? error.message : 'Failed to add new contact type');
    }
  }, [onError]);

  const handleCreateProfile = useCallback(async () => {
    if (saving) {
      console.log('Create profile skipped: saving in progress');
      return;
    }

    try {
      setSaving(true);
      console.log('Starting profile creation with current state:', {
        contacts: contacts.length,
        addresses: addresses.length,
        selectedTags: selectedTags.length
      });

      // Convert contacts array to object format for API
      const contactObject: { [key: string]: any } = {};
      contacts.forEach((contact, index) => {
        if (contact.type && contact.value.trim()) {
          contactObject[contact.type] = contact.value.trim();
          console.log(`Contact ${index}: ${contact.type} = ${contact.value}`);
        }
      });

      // Convert addresses array to object format for API
      const addressObject: { [key: string]: any } = {};
      addresses.forEach((addr, index) => {
        if (addr.type && (addr.doorNo || addr.street || addr.mainStreet || addr.city || addr.state || addr.pincode)) {
          addressObject[addr.type] = {
            doorNo: addr.doorNo,
            street: addr.street,
            mainStreet: addr.mainStreet,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode
          };
          console.log(`Address ${index}: ${addr.type}`, addr);
        }
      });

      const createData: CreateProfileRequest = {
        name: editForm.name,
        contact: contactObject,
        address: addressObject,
        tag: selectedTags,
        details: {
          bankDetails: {
            accountNumber: bankDetails.accountNumber,
            ifscCode: bankDetails.ifscCode,
            upi: bankDetails.upi
          }
        }
      };

      console.log('Creating profile with data:', createData);
      const result = await createProfile(createData);
      console.log('Profile creation successful:', result);

      // Call the onProfileCreated callback to refresh the list
      if (onProfileCreated) {
        await onProfileCreated();
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
      onError(error instanceof Error ? error.message : 'Failed to create profile');
    } finally {
      setSaving(false);
    }
  }, [contacts, addresses, selectedTags, editForm, bankDetails, onProfileCreated, onError, saving]);

  const handleDeleteProfile = useCallback(async () => {
    const currentProfile = selectedProfileRef.current;
    if (!currentProfile || saving) {
      console.log('Delete profile skipped:', { currentProfile: !!currentProfile, saving });
      return;
    }

    // Show confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the profile "${currentProfile.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setSaving(true);
      console.log('Starting profile deletion for profile ID:', currentProfile.profile_id);

      // Call the delete API (which uses updateProfile with is_delete: true)
      await deleteProfile(currentProfile.profile_id);
      console.log('Profile deletion successful');

      // Call the onProfileDeleted callback to refresh the list and reset the view
      if (onProfileDeleted) {
        await onProfileDeleted();
      }
    } catch (error) {
      console.error('Failed to delete profile:', error);
      onError(error instanceof Error ? error.message : 'Failed to delete profile');
    } finally {
      setSaving(false);
    }
  }, [onProfileDeleted, onError, saving]);

  const handleAutoSave = useCallback(async (skipRefresh: boolean = false) => {
    const currentProfile = selectedProfileRef.current;
    if (!currentProfile || saving || isCreating) {
      console.log('Auto-save skipped:', { currentProfile: !!currentProfile, isCreating, saving });
      return;
    }

    try {
      setSaving(true);
      console.log('Starting auto-save with current state:', {
        contacts: contacts.length,
        addresses: addresses.length,
        selectedTags: selectedTags.length,
        skipRefresh
      });

      // Convert contacts array to object format for API
      const contactObject: { [key: string]: any } = {};
      contacts.forEach((contact, index) => {
        if (contact.type && contact.value.trim()) {
          contactObject[contact.type] = contact.value.trim();
          console.log(`Contact ${index}: ${contact.type} = ${contact.value}`);
        }
      });

      // Convert addresses array to object format for API
      const addressObject: { [key: string]: any } = {};
      addresses.forEach((addr, index) => {
        if (addr.type && (addr.doorNo || addr.street || addr.mainStreet || addr.city || addr.state || addr.pincode)) {
          addressObject[addr.type] = {
            doorNo: addr.doorNo,
            street: addr.street,
            mainStreet: addr.mainStreet,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode
          };
          console.log(`Address ${index}: ${addr.type}`, addr);
        }
      });

      const updateData: UpdateProfileRequest = {
        name: editForm.name,
        // Send structured contact object
        contact: contactObject,
        // Send structured address object
        address: addressObject,
        // Send tags to the root 'tag' field as per API structure
        tag: selectedTags,
        // Add structured bank details to details section
        details: {
          ...currentProfile.details, // Use ref to get latest details if needed
          bankDetails: {
            accountNumber: bankDetails.accountNumber,
            ifscCode: bankDetails.ifscCode,
            upi: bankDetails.upi
          }
        }
      };

      console.log('Auto-saving data:', updateData);
      await updateProfile(currentProfile.profile_id, updateData);
      console.log('Auto-save successful');

      // Only refresh from server if skipRefresh is false
      if (!skipRefresh) {
        // Call the parent's update function to reload data
        // This will trigger the useEffect to reset state from the server
        await onProfileUpdate(currentProfile.profile_id);
      }
    } catch (error) {
      console.error('Failed to auto-save profile:', error);
      onError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }, [contacts, addresses, selectedTags, editForm, bankDetails, onProfileUpdate, onError, saving, isCreating]);

  // Wrapper for onChangeComplete callbacks that ignores the value parameter
  const handleAutoSaveComplete = useCallback(() => {
    if (!isCreating) {
      handleAutoSave(true); // Skip refresh to avoid refetching data on every input change
    }
  }, [handleAutoSave, isCreating]);

  // Special auto-save function that accepts updated state directly
  const handleAutoSaveWithState = useCallback(async (newContacts: ContactForm[], newAddresses: AddressForm[], newTags: string[], newEditForm: any, newBankDetails: any, skipRefresh: boolean = false) => {
    const currentProfile = selectedProfileRef.current;
    if (!currentProfile || saving) {
      console.log('Auto-save with state skipped:', { currentProfile: !!currentProfile, saving });
      return;
    }

    try {
      setSaving(true);
      console.log('Starting auto-save with provided state:', {
        contacts: newContacts.length,
        addresses: newAddresses.length,
        selectedTags: newTags.length,
        skipRefresh
      });

      // Convert contacts array to object format for API
      const contactObject: { [key: string]: any } = {};
      newContacts.forEach((contact, index) => {
        if (contact.type && contact.value.trim()) {
          contactObject[contact.type] = contact.value.trim();
          console.log(`Contact ${index}: ${contact.type} = ${contact.value}`);
        }
      });

      // Convert addresses array to object format for API
      const addressObject: { [key: string]: any } = {};
      newAddresses.forEach((addr, index) => {
        if (addr.type && (addr.doorNo || addr.street || addr.mainStreet || addr.city || addr.state || addr.pincode)) {
          addressObject[addr.type] = {
            doorNo: addr.doorNo,
            street: addr.street,
            mainStreet: addr.mainStreet,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode
          };
          console.log(`Address ${index}: ${addr.type}`, addr);
        }
      });

      const updateData: UpdateProfileRequest = {
        name: newEditForm.name,
        contact: contactObject,
        address: addressObject,
        tag: newTags,
        details: {
          ...currentProfile.details,
          bankDetails: {
            accountNumber: newBankDetails.accountNumber,
            ifscCode: newBankDetails.ifscCode,
            upi: newBankDetails.upi
          }
        }
      };

      console.log('Auto-saving data with provided state:', updateData);
      await updateProfile(currentProfile.profile_id, updateData);
      console.log('Auto-save with state successful');

      // Only refresh from server if skipRefresh is false
      if (!skipRefresh) {
        await onProfileUpdate(currentProfile.profile_id);
      }
    } catch (error) {
      console.error('Failed to auto-save profile with state:', error);
      onError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }, [onProfileUpdate, onError, saving]);

  // Prepare contact type options from user context, local additions, and fallback to default types
  const contactTypes = useMemo(() => {
    const userContacts = user?.dropdowns?.contact || [];
    const defaultContacts = defaultContactTypes.map(ct => ct.value);
    const allContacts = [...new Set([...userContacts, ...localContactTypes, ...defaultContacts])]; // Merge and remove duplicates
    return allContacts.map((item: string) => ({ label: item, value: item }));
  }, [user?.dropdowns?.contact, localContactTypes]);

  if (!selectedProfile && !isCreating) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Profile Selected</h3>
          <p className="text-gray-500">Select a profile from the list to view details or click "Create Profile" to add a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">
              {isCreating ? 'Create New Profile' : 'Profile Details'}
            </h2>
            {saving && <p className="text-sm text-blue-600 mt-1">
              {isCreating ? 'Creating...' : 'Saving...'}
            </p>}
          </div>

          <div className="flex items-center space-x-4">
            <Button
              onClick={handleOpenTagsModal}
              variant="secondary"
              size="m"
              className="whitespace-nowrap"
            >
              Manage Tags
            </Button>

            {isCreating && (
              <Button
                onClick={handleCreateProfile}
                disabled={saving || !editForm.name.trim()}
                variant="primary"
                size="m"
              >
                Save Profile
              </Button>
            )}
          </div>
        </div>

        {/* Tags Section - New line below title */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Tags:</span>
          {selectedTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag, index) => (
                <div
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-white border border-gray-200 text-gray-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  {tag}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-500">No tags selected</span>
          )}
        </div>
      </div>

      {/* Profile Data Sections */}
      <div className="space-y-4">
        {/* Name Section */}
        <div>
          <h3 className="text-[14px] font-medium text-gray-900 mb-2">Name</h3>
          <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
            <SmartInputBox
              value={editForm.name}
              onChange={(value) => handleFormChange('name', value)}
              onChangeComplete={handleAutoSaveComplete} // Save when name input completes
              placeholder="Enter profile name"
              required={true}
            />
          </div>
        </div>

        {/* Contact Section */}
        <div>
          <h3 className="text-[14px] font-medium text-gray-900 mb-4">Contact</h3>
          <div className="space-y-4">
            {contacts.map((contact, index) => (
              <div key={`contact-${index}`} className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                <div className="grid grid-cols-12 gap-4 ">
                  <div className="col-span-3"> {/* Adjust col-span as needed to visually match 200px */}
                    <SmartDropdown
                      options={contactTypes}
                      value={contact.type}
                      onChange={(value) => {
                        const newValue = Array.isArray(value) ? value[0] : value;
                        handleContactChange(index, 'type', newValue);
                      }}
                      onChangeComplete={(value) => {
                        const newValue = Array.isArray(value) ? value[0] : value;
                        const newContacts = [...contacts];
                        newContacts[index] = { ...newContacts[index], type: newValue };
                        setContacts(newContacts);
                        // Save when contact type changes
                        setTimeout(() => handleAutoSaveWithState(newContacts, addresses, selectedTags, editForm, bankDetails), 100);
                      }}
                      placeholder="Select contact type"
                      enableAddNew={true}
                      addNewLabel="+ Add Contact Type"
                      addNewPlaceholder="Enter new contact type"
                      onAddNew={handleAddNewContact}
                      className="w-full" // Keep it full width for responsiveness, but it will visually be constrained by the grid
                    />
                  </div>
                  <div className="col-span-8 pt-0.5">
                    <SmartInputBox
                      value={contact.value}
                      onChange={(value) => handleContactChange(index, 'value', value)}
                      onChangeComplete={handleAutoSaveComplete} // Save when contact value changes
                      placeholder={
                        contact.type === 'Email' ? 'Enter email address' :
                        contact.type === 'phone_no' ? 'Enter phone number' :
                        contact.type === 'LinkedIn' ? 'Enter LinkedIn URL' :
                        'Enter contact value'
                      }
                      label=""
                      className="w-full" // Ensure it takes full width of its container
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    {contacts.length > 1 && (
                      <Button
                        onClick={() => {
                          console.log(`Removing contact at index ${index}`);
                          removeContact(index);
                        }}
                        variant="outline" // Or "ghost" if available and preferred
                        size="s"
                        className="w-full h-9" // Adjust height to match input boxes if needed
                      >
                        {/* Trash/Dustbin Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add Contact Button at the bottom */}
            <div className="flex justify-center">
              <Button
                onClick={addNewContact}
                variant="outline"
                size="s"
                className="w-full max-w-xs"
              >
                + Add Contact
              </Button>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div>
          <h3 className="text-[14px] font-medium text-gray-900 mb-4">Address</h3>

          <div className="space-y-6">
            {addresses.map((address, index) => (
              <div key={`address-${index}`} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <SmartDropdown
                    options={addressTypes}
                    value={address.type}
                    onChange={(value) => {
                      const newValue = Array.isArray(value) ? value[0] : value;
                      handleAddressChange(index, 'type', newValue);
                    }}
                    onChangeComplete={(value) => {
                      const newValue = Array.isArray(value) ? value[0] : value;
                      const newAddresses = [...addresses];
                      newAddresses[index] = { ...newAddresses[index], type: newValue };
                      setAddresses(newAddresses);
                      // Save when address type changes
                      setTimeout(() => handleAutoSaveWithState(contacts, newAddresses, selectedTags, editForm, bankDetails), 100);
                    }}
                    placeholder="Select address type"
                    className="w-48"
                  />
                  {addresses.length > 1 && (
                    <Button
                      onClick={() => {
                        console.log(`Removing address at index ${index}`);
                        removeAddress(index);
                      }}
                      variant="danger"
                      size="s"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <SmartInputBox
                    value={address.doorNo}
                    onChange={(value) => handleAddressChange(index, 'doorNo', value)}
                    onChangeComplete={handleAutoSaveComplete} // Save when doorNo changes
                    placeholder="Door No"
                    label="Door No"
                    className="mb-2"
                  />
                  <SmartInputBox
                    value={address.street}
                    onChange={(value) => handleAddressChange(index, 'street', value)}
                    onChangeComplete={handleAutoSaveComplete} // Save when street changes
                    placeholder="Street"
                    label="Street"
                    className="mb-2"
                  />
                  <SmartInputBox
                    value={address.mainStreet}
                    onChange={(value) => handleAddressChange(index, 'mainStreet', value)}
                    onChangeComplete={handleAutoSaveComplete} // Save when mainStreet changes
                    placeholder="Main Street"
                    label="Main Street"
                    className="mb-2"
                  />
                  <SmartInputBox
                    value={address.city}
                    onChange={(value) => handleAddressChange(index, 'city', value)}
                    onChangeComplete={handleAutoSaveComplete} // Save when city changes
                    placeholder="City / Town"
                    label="City / Town"
                    className="mb-2"
                  />
                  <SmartDropdown
                    options={indianStates}
                    value={address.state}
                    onChange={(value) => {
                      const newValue = Array.isArray(value) ? value[0] : value;
                      handleAddressChange(index, 'state', newValue);
                    }}
                    onChangeComplete={(value) => {
                      const newValue = Array.isArray(value) ? value[0] : value;
                      const newAddresses = [...addresses];
                      newAddresses[index] = { ...newAddresses[index], state: newValue };
                      setAddresses(newAddresses);
                      // Save when state changes
                      setTimeout(() => handleAutoSaveWithState(contacts, newAddresses, selectedTags, editForm, bankDetails), 100);
                    }}
                    placeholder="Select State"
                    label="State"
                    enableSearch={true}
                    className="mb-2"
                  />
                  <SmartInputBox
                    value={address.pincode}
                    onChange={(value) => handleAddressChange(index, 'pincode', value)}
                    onChangeComplete={handleAutoSaveComplete} // Save when pincode changes
                    placeholder="Pincode"
                    label="Pincode"
                    className="mb-2"
                  />
                </div>
              </div>
            ))}

            {/* Add Address Button at the bottom */}
            <div className="flex justify-center">
              <Button
                onClick={addNewAddress}
                variant="outline"
                size="s"
                className="w-full max-w-xs"
              >
                + Add Address
              </Button>
            </div>
          </div>
        </div>

        {/* Bank Details Section */}
        <div>
          <h3 className="text-[14px] font-medium text-gray-900 mb-4">Bank Details</h3>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-2">
              <SmartInputBox
                value={bankDetails.accountNumber}
                onChange={(value) => handleBankDetailsChange('accountNumber', value)}
                onChangeComplete={handleAutoSaveComplete} // Save when account number changes
                placeholder="Account Number"
                label="Account Number"
                className="mb-2"
              />
              <SmartInputBox
                value={bankDetails.ifscCode}
                onChange={(value) => handleBankDetailsChange('ifscCode', value)}
                onChangeComplete={handleAutoSaveComplete} // Save when IFSC code changes
                placeholder="IFSC Code"
                label="IFSC Code"
                className="mb-2"
              />
              <SmartInputBox
                value={bankDetails.upi}
                onChange={(value) => handleBankDetailsChange('upi', value)}
                onChangeComplete={handleAutoSaveComplete} // Save when UPI changes
                placeholder="UPI ID (e.g., name@paytm)"
                label="UPI ID"
                className="mb-2"
              />
            </div>
          </div>
        </div>

        {/* Delete Profile Section - Only show when editing existing profile */}
        {!isCreating && selectedProfile && (
          <div className="flex justify-center pt-8">
            <Button
              onClick={handleDeleteProfile}
              disabled={saving}
              variant="outline"
              size="m"
              className="border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700"
            >
              Delete Profile
            </Button>
          </div>
        )}
      </div>

      {/* Tags Modal */}
      <TagsModal
        isOpen={isTagsModalOpen}
        onClose={handleCloseTagsModal}
        selectedTags={selectedTags}
        onTagsChange={handleTagsChange}
        onError={onError}
      />
    </div>
  );
}