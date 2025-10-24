'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  updateProfile,
  createProfile,
  deleteProfile,
  addNewContactType,
  addNewAdditionalDetailType,
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
const defaultContactTypes: { label: string; value: string }[] = [];

// Default additional details types
const defaultAdditionalDetailsTypes: { label: string; value: string }[] = [];

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

interface AdditionalDetailForm {
  type: string;
  value: string;
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
  const [saving, setSaving] = useState<boolean>(false); // For explicit actions
  const [backgroundSaving, setBackgroundSaving] = useState<boolean>(false); // For silent auto-save

  // Local state for dynamically added contact types
  const [localContactTypes, setLocalContactTypes] = useState<string[]>([]);

  // Local state for dynamically added additional details types
  const [localAdditionalDetailsTypes, setLocalAdditionalDetailsTypes] = useState<string[]>([]);

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

  // Additional details form state - array to handle multiple additional details
  const [additionalDetails, setAdditionalDetails] = useState<AdditionalDetailForm[]>([
    {
      type: '',
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

      // Parse contacts from selectedProfile (pair type and value for each contact)
      if (selectedProfile.contact) {
        let parsedContacts: ContactForm[] = [];
        if (Array.isArray(selectedProfile.contact)) {
          // If array is in [{type: 'Email', value: '...'}, ...] format, use directly
          if (selectedProfile.contact.every((c: any) => 'type' in c && 'value' in c)) {
            parsedContacts = selectedProfile.contact as ContactForm[];
          } else {
            // If array is alternating {type: 'type', value: 'Email'}, {type: 'value', value: 'email@...'}
            for (let i = 0; i < selectedProfile.contact.length; i += 2) {
              const typeObj = selectedProfile.contact[i];
              const valueObj = selectedProfile.contact[i + 1];
              if (typeObj && valueObj && typeObj.type && valueObj.value) {
                parsedContacts.push({ type: typeObj.value, value: valueObj.value });
              }
            }
          }
        } else if (typeof selectedProfile.contact === 'object' && selectedProfile.contact !== null) {
          Object.entries(selectedProfile.contact).forEach(([type, value]) => {
            if (typeof value === 'string' && value.trim()) {
              parsedContacts.push({ type, value });
            }
          });
        } else if (typeof selectedProfile.contact === 'string') {
          try {
            const contactData = JSON.parse(selectedProfile.contact);
            if (Array.isArray(contactData)) {
              if (contactData.every((c: any) => 'type' in c && 'value' in c)) {
                parsedContacts = contactData as ContactForm[];
              } else {
                for (let i = 0; i < contactData.length; i += 2) {
                  const typeObj = contactData[i];
                  const valueObj = contactData[i + 1];
                  if (typeObj && valueObj && typeObj.type && valueObj.value) {
                    parsedContacts.push({ type: typeObj.value, value: valueObj.value });
                  }
                }
              }
            } else if (typeof contactData === 'object' && contactData !== null) {
              Object.entries(contactData).forEach(([type, value]) => {
                if (typeof value === 'string' && value.trim()) {
                  parsedContacts.push({ type, value });
                }
              });
            }
          } catch {
            parsedContacts = [{ type: 'Email', value: selectedProfile.contact }];
          }
        }
        setContacts(parsedContacts.length > 0 ? parsedContacts : [{ type: 'Email', value: '' }]);
      } else {
        setContacts([{ type: 'Email', value: '' }]);
      }

      // Parse additional details from selectedProfile
      if (selectedProfile.details?.additionalDetails) {
        if (typeof selectedProfile.details.additionalDetails === 'object') {
          const additionalDetailsData = selectedProfile.details.additionalDetails as any;
          const parsedAdditionalDetails: AdditionalDetailForm[] = [];
          Object.keys(additionalDetailsData).forEach(key => {
            const detailValue = additionalDetailsData[key];
            if (detailValue && typeof detailValue === 'string') {
              parsedAdditionalDetails.push({
                type: key,
                value: detailValue
              });
            }
          });
          setAdditionalDetails(parsedAdditionalDetails.length > 0 ? parsedAdditionalDetails : [{ type: '', value: '' }]);
        } else if (typeof selectedProfile.details.additionalDetails === 'string') {
          try {
            const additionalDetailsData = JSON.parse(selectedProfile.details.additionalDetails);
            const parsedAdditionalDetails: AdditionalDetailForm[] = [];
            Object.keys(additionalDetailsData).forEach(key => {
              const detailValue = additionalDetailsData[key];
              if (detailValue && typeof detailValue === 'string') {
                parsedAdditionalDetails.push({
                  type: key,
                  value: detailValue
                });
              }
            });
            setAdditionalDetails(parsedAdditionalDetails.length > 0 ? parsedAdditionalDetails : [{ type: '', value: '' }]);
          } catch {
            setAdditionalDetails([{ type: '', value: '' }]);
          }
        } else {
          setAdditionalDetails([{ type: '', value: '' }]);
        }
      } else {
        setAdditionalDetails([{ type: '', value: '' }]);
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

      // Parse addresses from selectedProfile (array of flat objects)
      if (selectedProfile.address) {
        let parsedAddresses: AddressForm[] = [];
        if (Array.isArray(selectedProfile.address)) {
          // Each address is a flat object with all fields
          parsedAddresses = selectedProfile.address.map((addr: any) => ({
            type: addr.type || 'home',
            doorNo: addr.doorNo || '',
            street: addr.street || '',
            mainStreet: addr.mainStreet || '',
            city: addr.city || '',
            state: addr.state || '',
            pincode: addr.pincode || ''
          }));
        } else if (typeof selectedProfile.address === 'object' && selectedProfile.address !== null) {
          // If it's a dict, treat keys as types
          Object.entries(selectedProfile.address).forEach(([type, fields]) => {
            if (typeof fields === 'object' && fields !== null) {
              const addrFields = fields as Partial<AddressForm>;
              parsedAddresses.push({
                type,
                doorNo: addrFields.doorNo || '',
                street: addrFields.street || '',
                mainStreet: addrFields.mainStreet || '',
                city: addrFields.city || '',
                state: addrFields.state || '',
                pincode: addrFields.pincode || ''
              });
            }
          });
        } else if (typeof selectedProfile.address === 'string') {
          try {
            const addressData = JSON.parse(selectedProfile.address);
            if (Array.isArray(addressData)) {
              parsedAddresses = addressData.map((addr: any) => ({
                type: addr.type || 'home',
                doorNo: addr.doorNo || '',
                street: addr.street || '',
                mainStreet: addr.mainStreet || '',
                city: addr.city || '',
                state: addr.state || '',
                pincode: addr.pincode || ''
              }));
            } else if (typeof addressData === 'object' && addressData !== null) {
              Object.entries(addressData).forEach(([type, fields]) => {
                if (typeof fields === 'object' && fields !== null) {
                  const addrFields = fields as Partial<AddressForm>;
                  parsedAddresses.push({
                    type,
                    doorNo: addrFields.doorNo || '',
                    street: addrFields.street || '',
                    mainStreet: addrFields.mainStreet || '',
                    city: addrFields.city || '',
                    state: addrFields.state || '',
                    pincode: addrFields.pincode || ''
                  });
                }
              });
            }
          } catch {
            parsedAddresses = [{ type: 'home', doorNo: '', street: '', mainStreet: '', city: '', state: '', pincode: '' }];
          }
        }
        setAddresses(parsedAddresses.length > 0 ? parsedAddresses : [{ type: 'home', doorNo: '', street: '', mainStreet: '', city: '', state: '', pincode: '' }]);
      } else {
        setAddresses([{ type: 'home', doorNo: '', street: '', mainStreet: '', city: '', state: '', pincode: '' }]);
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
  setAdditionalDetails([{ type: '', value: '' }]);
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
  // Debounced auto-save for contact value changes
  const contactDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const CONTACT_DEBOUNCE_DELAY = 600;
  const handleContactChange = (index: number, field: keyof ContactForm, value: string) => {
    setContacts(prev => {
      const newContacts = [...prev];
      newContacts[index] = { ...newContacts[index], [field]: value };
      return newContacts;
    });
    // Only debounce for value changes, not type
    if (field === 'value') {
      if (contactDebounceTimeoutRef.current) {
        clearTimeout(contactDebounceTimeoutRef.current);
      }
      contactDebounceTimeoutRef.current = setTimeout(() => {
        if (!isCreating) {
          handleAutoSaveWithState(
            contacts,
            addresses,
            selectedTags,
            editForm,
            bankDetails,
            additionalDetails
          );
        }
      }, CONTACT_DEBOUNCE_DELAY);
    }
  };

  // Additional details management functions
    // Debounced auto-save for additional details
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const DEBOUNCE_DELAY = 600;

    const handleAdditionalDetailChange = (index: number, field: keyof AdditionalDetailForm, value: string) => {
      setAdditionalDetails(prev => {
        const newDetails = [...prev];
        newDetails[index] = { ...newDetails[index], [field]: value };
        return newDetails;
      });
      // Only debounce for value changes, not type
      if (field === 'value') {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
          if (!isCreating) {
            handleAutoSaveWithState(
              contacts,
              addresses,
              selectedTags,
              editForm,
              bankDetails,
              additionalDetails
            );
          }
        }, DEBOUNCE_DELAY);
      }
    };

  // Tags management function
  const handleTagsChange = (value: string | string[]) => {
    const tags = Array.isArray(value) ? value : [value];
    // Only trigger auto-save if tags actually changed
    const tagsChanged = JSON.stringify(tags) !== JSON.stringify(selectedTags);
    setSelectedTags(tags);
    console.log('Tags changed:', tags);
    // Only auto-save if not in create mode and tags changed
    if (!isCreating && tagsChanged) {
      setTimeout(() => {
        // Background auto-save for tags only
        handleBackgroundAutoSaveTags(tags);
      }, 100);
    }
  };

  // Background auto-save for tags only (does not set 'saving')
  const handleBackgroundAutoSaveTags = useCallback(async (tags: string[]) => {
    const currentProfile = selectedProfileRef.current;
    if (!currentProfile || isCreating) {
      return;
    }
    try {
      setBackgroundSaving(true);
      await updateProfile(currentProfile.profile_id, { tag: tags });
      setSelectedTags(tags);
    } catch (error) {
      console.error('Failed to auto-save tags:', error);
      onError(error instanceof Error ? error.message : 'Failed to save tags');
    } finally {
      setBackgroundSaving(false);
    }
  }, [onError, isCreating]);

  const addNewContact = () => {
    // Only allow adding if the last contact is filled
    const lastContact = contacts[contacts.length - 1];
    if (lastContact && lastContact.type && lastContact.value.trim()) {
      const newContacts = [...contacts, { type: '', value: '' }];
      setContacts(newContacts);
      console.log('Added new contact, new contacts array:', newContacts);
      // Don't auto-save when adding empty contact - wait for user to enter data
    }
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      const newContacts = contacts.filter((_, i) => i !== index);
      setContacts(newContacts);
      console.log(`Removed contact at index ${index}, new contacts array:`, newContacts);
      // Auto-save immediately when removing contact, but skip parent refresh for smooth UI
      setTimeout(() => handleAutoSaveWithState(newContacts, addresses, selectedTags, editForm, bankDetails, additionalDetails, true), 100);
    }
  };

  const addNewAdditionalDetail = () => {
    // Only allow adding if the last additional detail is filled
    const lastDetail = additionalDetails[additionalDetails.length - 1];
    if (lastDetail && lastDetail.type && lastDetail.value.trim()) {
      const newDetails = [...additionalDetails, { type: '', value: '' }];
      setAdditionalDetails(newDetails);
      console.log('Added new additional detail, new details array:', newDetails);
      // Don't auto-save when adding empty detail - wait for user to enter data
    }
  };

  const removeAdditionalDetail = (index: number) => {
    if (additionalDetails.length > 1) {
      const newDetails = additionalDetails.filter((_, i) => i !== index);
      setAdditionalDetails(newDetails);
      console.log(`Removed additional detail at index ${index}, new details array:`, newDetails);
      // Auto-save immediately when removing detail, but skip parent refresh for smooth UI
      setTimeout(() => handleAutoSaveWithState(contacts, addresses, selectedTags, editForm, bankDetails, newDetails, true), 100);
    } else {
      // Only one row: reset its fields to empty
      const newDetails = [{ type: '', value: '' }];
      setAdditionalDetails(newDetails);
      console.log('Reset last additional detail row to empty');
      setTimeout(() => handleAutoSaveWithState(contacts, addresses, selectedTags, editForm, bankDetails, newDetails, true), 100);
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
    // Only allow adding if the last address is filled
    const lastAddress = addresses[addresses.length - 1];
    if (
      lastAddress &&
      lastAddress.type &&
      (lastAddress.doorNo || lastAddress.street || lastAddress.mainStreet || lastAddress.city || lastAddress.state || lastAddress.pincode)
    ) {
      const newAddresses = [...addresses, {
        type: '',
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
    }
  };

  const removeAddress = (index: number) => {
    if (addresses.length > 1) {
      const newAddresses = addresses.filter((_, i) => i !== index);
      setAddresses(newAddresses);
      console.log(`Removed address at index ${index}, new addresses array:`, newAddresses);
      // Auto-save immediately when removing address (this should update the server)
      setTimeout(() => handleAutoSaveWithState(contacts, newAddresses, selectedTags, editForm, bankDetails, additionalDetails), 100);
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
      // Add the new contact type to local state immediately (only for contact types)
      setLocalContactTypes(prev => [...prev, newContactType]);
      // Show success message
      alert(`Contact type "${newContactType}" added successfully!`);
    } catch (error) {
      console.error('Error adding new contact type:', error);
      onError(error instanceof Error ? error.message : 'Failed to add new contact type');
    }
  }, [onError]);

  // Function to add new additional detail type using the content/dropdown API
  const handleAddNewAdditionalDetail = useCallback(async (newDetailType: string) => {
    try {
      console.log('Adding new additional detail type:', newDetailType);
      // Call backend API to persist additional detail type
      const result = await addNewAdditionalDetailType(newDetailType);
      console.log('New additional detail type added successfully:', result);
      // Add the new additional detail type to local state
      setLocalAdditionalDetailsTypes(prev => [...prev, newDetailType]);
      alert(`Additional detail type "${newDetailType}" added successfully!`);
    } catch (error) {
      console.error('Error adding new additional detail type:', error);
      onError(error instanceof Error ? error.message : 'Failed to add new additional detail type');
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
        selectedTags: selectedTags.length,
        additionalDetails: additionalDetails.length
      });


      // Convert contacts array to array format for API (allow duplicates)
      const contactArray: ContactForm[] = contacts
        .filter(contact => contact.type && contact.value.trim())
        .map(contact => ({ type: contact.type, value: contact.value.trim() }));
      contactArray.forEach((contact, index) => {
        console.log(`Contact ${index}: ${contact.type} = ${contact.value}`);
      });

      // Convert addresses array to array format for API (allow duplicates)
      const addressArray: AddressForm[] = addresses
        .filter(addr => addr.type && (addr.doorNo || addr.street || addr.mainStreet || addr.city || addr.state || addr.pincode))
        .map(addr => ({
          type: addr.type,
          doorNo: addr.doorNo,
          street: addr.street,
          mainStreet: addr.mainStreet,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode
        }));
      addressArray.forEach((addr, index) => {
        console.log(`Address ${index}: ${addr.type}`, addr);
      });

      // Convert additional details array to object format for API
      const additionalDetailsObject: { [key: string]: any } = {};
      additionalDetails.forEach((detail, index) => {
        if (detail.type && detail.value.trim()) {
          additionalDetailsObject[detail.type] = detail.value.trim();
          console.log(`Additional Detail ${index}: ${detail.type} = ${detail.value}`);
        }
      });


      const createData: CreateProfileRequest = {
        name: editForm.name,
        contact: contactArray,
        address: addressArray,
        tag: selectedTags,
        details: {
          bankDetails: {
            accountNumber: bankDetails.accountNumber,
            ifscCode: bankDetails.ifscCode,
            upi: bankDetails.upi
          },
          additionalDetails: additionalDetailsObject
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
  }, [contacts, addresses, selectedTags, editForm, bankDetails, additionalDetails, onProfileCreated, onError, saving]);

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
      setBackgroundSaving(true);
      // Build update payload with only changed fields
      const updateData: UpdateProfileRequest = {};
      // Compare and add only changed fields
      if (editForm.name !== currentProfile.name) {
        updateData.name = editForm.name;
      }
      // Contacts
      const contactArray: ContactForm[] = contacts
        .filter(contact => contact.type && contact.value.trim())
        .map(contact => ({ type: contact.type, value: contact.value.trim() }));
      if (JSON.stringify(contactArray) !== JSON.stringify(currentProfile.contact)) {
        updateData.contact = contactArray;
      }
      // Addresses
      const addressArray: AddressForm[] = addresses
        .filter(addr => addr.type && (addr.doorNo || addr.street || addr.mainStreet || addr.city || addr.state || addr.pincode))
        .map(addr => ({
          type: addr.type,
          doorNo: addr.doorNo,
          street: addr.street,
          mainStreet: addr.mainStreet,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode
        }));
      if (JSON.stringify(addressArray) !== JSON.stringify(currentProfile.address)) {
        updateData.address = addressArray;
      }
      // Tags
      if (JSON.stringify(selectedTags) !== JSON.stringify(currentProfile.tag)) {
        updateData.tag = selectedTags;
      }
      // Bank details
      const bankDetailsChanged = (
        bankDetails.accountNumber !== (currentProfile.details?.bankDetails?.accountNumber || '') ||
        bankDetails.ifscCode !== (currentProfile.details?.bankDetails?.ifscCode || '') ||
        bankDetails.upi !== (currentProfile.details?.bankDetails?.upi || '')
      );
      // Additional details
      const additionalDetailsObject: { [key: string]: any } = {};
      additionalDetails.forEach((detail, index) => {
        if (detail.type && detail.value.trim()) {
          additionalDetailsObject[detail.type] = detail.value.trim();
        }
      });
      const additionalDetailsChanged = JSON.stringify(additionalDetailsObject) !== JSON.stringify(currentProfile.details?.additionalDetails || {});
      if (bankDetailsChanged || additionalDetailsChanged) {
        updateData.details = {
          bankDetails: {
            accountNumber: bankDetails.accountNumber,
            ifscCode: bankDetails.ifscCode,
            upi: bankDetails.upi
          },
          additionalDetails: additionalDetailsObject
        };
      }
      // Only send update if something changed
      if (Object.keys(updateData).length === 0) {
        setBackgroundSaving(false);
        return;
      }
      console.log('Auto-saving data:', updateData);
      await updateProfile(currentProfile.profile_id, updateData);
      console.log('Auto-save successful');
      // Do not refetch profile data after auto-save to keep UI smooth
    } catch (error) {
      console.error('Failed to auto-save profile:', error);
      onError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setBackgroundSaving(false);
    }
  }, [contacts, addresses, selectedTags, editForm, bankDetails, additionalDetails, onError, saving, isCreating]);

  // Wrapper for onChangeComplete callbacks that ignores the value parameter
  const handleAutoSaveComplete = useCallback(() => {
    if (!isCreating) {
      handleAutoSave(true); // Skip refresh to avoid refetching data on every input change
    }
  }, [handleAutoSave, isCreating]);

  // Special auto-save function that accepts updated state directly
  const handleAutoSaveWithState = useCallback(async (newContacts: ContactForm[], newAddresses: AddressForm[], newTags: string[], newEditForm: any, newBankDetails: any, newAdditionalDetails: AdditionalDetailForm[], skipRefresh: boolean = false) => {
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
        additionalDetails: newAdditionalDetails.length,
        skipRefresh
      });

      // Convert contacts array to array format for API (allow duplicates)
      const contactArray: ContactForm[] = newContacts
        .filter(contact => contact.type && contact.value.trim())
        .map(contact => ({ type: contact.type, value: contact.value.trim() }));
      contactArray.forEach((contact, index) => {
        console.log(`Contact ${index}: ${contact.type} = ${contact.value}`);
      });

      // Convert addresses array to array format for API (allow duplicates)
      const addressArray: AddressForm[] = newAddresses
        .filter(addr => addr.type && (addr.doorNo || addr.street || addr.mainStreet || addr.city || addr.state || addr.pincode))
        .map(addr => ({
          type: addr.type,
          doorNo: addr.doorNo,
          street: addr.street,
          mainStreet: addr.mainStreet,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode
        }));
      addressArray.forEach((addr, index) => {
        console.log(`Address ${index}: ${addr.type}`, addr);
      });

      // Convert additional details array to object format for API
      const additionalDetailsObject: { [key: string]: any } = {};
      newAdditionalDetails.forEach((detail, index) => {
        if (detail.type && detail.value.trim()) {
          additionalDetailsObject[detail.type] = detail.value.trim();
          console.log(`Additional Detail ${index}: ${detail.type} = ${detail.value}`);
        }
      });

      const updateData: UpdateProfileRequest = {
        name: newEditForm.name,
        contact: contactArray,
        address: addressArray,
        tag: newTags,
        details: {
          ...currentProfile.details,
          bankDetails: {
            accountNumber: newBankDetails.accountNumber,
            ifscCode: newBankDetails.ifscCode,
            upi: newBankDetails.upi
          },
          additionalDetails: additionalDetailsObject
        }
      };

      console.log('Auto-saving data with provided state:', updateData);
      await updateProfile(currentProfile.profile_id, updateData);
      console.log('Auto-save with state successful');
      // Do not refetch profile data after auto-save; keep all changes local
    } catch (error) {
      console.error('Failed to auto-save profile with state:', error);
      onError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }, [onError, saving]);

  // Prepare contact type options from user context, local additions, and fallback to default types
  const contactTypes = useMemo(() => {
    const userContacts = user?.dropdowns?.contact || [];
    const allContacts = [...new Set([...userContacts, ...localContactTypes])]; // Only user context and local additions
    return allContacts.map((item: string) => ({ label: item, value: item }));
  }, [user?.dropdowns?.contact, localContactTypes]);

  // Prepare additional details type options from user context, local additions, and fallback to default types
  const additionalDetailsTypes = useMemo(() => {
    const userAdditionalDetails = user?.dropdowns?.additional_details || [];
    const defaultDetails = defaultAdditionalDetailsTypes.map(dt => dt.value);
    const allDetails = [...new Set([...userAdditionalDetails, ...localAdditionalDetailsTypes, ...defaultDetails])]; // Merge and remove duplicates
    return allDetails.map((item: string) => ({ label: item, value: item }));
  }, [user?.dropdowns?.additional_details, localAdditionalDetailsTypes]);

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
            {/* Only show saving indicator for explicit actions, not background auto-saves (like tags) */}
            {saving && !backgroundSaving && (
              <p className="text-sm text-blue-600 mt-1">
                {isCreating ? 'Creating...' : 'Saving...'}
              </p>
            )}
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
                        // Do not auto-save on dropdown change; only update state
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
                      onChangeComplete={() => {
                        if (!isCreating) {
                          handleAutoSaveWithState(contacts, addresses, selectedTags, editForm, bankDetails, additionalDetails);
                        }
                      }}
                      placeholder={
                        contact.type === 'Email' ? 'Enter email address' :
                        contact.type === 'phone_no' ? 'Enter phone number' :
                        contact.type === 'LinkedIn' ? 'Enter LinkedIn URL' :
                        'Enter contact value'
                      }
                      label=""
                      className="w-full"
                      disabled={!contact.type}
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
                disabled={(() => {
                  const lastContact = contacts[contacts.length - 1];
                  return !(lastContact && lastContact.type && lastContact.value.trim());
                })()}
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
                      setTimeout(() => handleAutoSaveWithState(contacts, newAddresses, selectedTags, editForm, bankDetails, additionalDetails), 100);
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
                      setTimeout(() => handleAutoSaveWithState(contacts, newAddresses, selectedTags, editForm, bankDetails, additionalDetails), 100);
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
                disabled={(() => {
                  const lastAddress = addresses[addresses.length - 1];
                  return !(lastAddress && lastAddress.type && (lastAddress.doorNo || lastAddress.street || lastAddress.mainStreet || lastAddress.city || lastAddress.state || lastAddress.pincode));
                })()}
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

        {/* Additional Details Section */}
        <div>
          <h3 className="text-[14px] font-medium text-gray-900 mb-4">Additional Details</h3>
          <div className="space-y-4">
            {additionalDetails.map((detail, index) => {
              // Get all selected types except for the current row
              const selectedTypes = additionalDetails
                .map((d, i) => i !== index ? d.type : null)
                .filter(t => !!t);
              // Filter options to exclude already-selected types except for current row's type
              const filteredOptions = additionalDetailsTypes.filter(opt => {
                return !selectedTypes.includes(opt.value) || opt.value === detail.type;
              });
              return (
                <div key={`detail-${index}`} className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 ">
                    <div className="col-span-3">
                      <SmartDropdown
                        options={filteredOptions}
                        value={detail.type}
                        onChange={(value) => {
                          const newValue = Array.isArray(value) ? value[0] : value;
                          setAdditionalDetails(prev => {
                            const updated = [...prev];
                            updated[index] = { ...updated[index], type: newValue };
                            return updated;
                          });
                          if (!isCreating) {
                            setTimeout(() => {
                              handleAutoSaveWithState(
                                contacts,
                                addresses,
                                selectedTags,
                                editForm,
                                bankDetails,
                                additionalDetails,
                                true
                              );
                            }, 0);
                          }
                        }}
                        placeholder="Select detail type"
                        enableAddNew={true}
                        addNewLabel="+ Add Detail Type"
                        addNewPlaceholder="Enter new detail type"
                        onAddNew={handleAddNewAdditionalDetail}
                        className="w-full"
                      />
                    </div>
                    <div className="col-span-8 pt-0.5">
                      <SmartInputBox
                        value={detail.value}
                        onChange={(value) => handleAdditionalDetailChange(index, 'value', value)}
                        placeholder={
                          detail.type === 'PAN' ? 'Enter PAN number' :
                          detail.type === 'Aadhar' ? 'Enter Aadhar number' :
                          detail.type === 'GST' ? 'Enter GST number' :
                          'Enter detail value'
                        }
                        label=""
                        className="w-full"
                        disabled={!detail.type}
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      <Button
                        onClick={() => {
                          console.log(`Removing additional detail at index ${index}`);
                          removeAdditionalDetail(index);
                        }}
                        variant="outline"
                        size="s"
                        className="w-full h-9"
                      >
                        {/* Trash/Dustbin Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Details Button at the bottom */}
            <div className="flex justify-center">
              <Button
                onClick={addNewAdditionalDetail}
                variant="outline"
                size="s"
                className="w-full max-w-xs"
                disabled={(() => {
                  const lastDetail = additionalDetails[additionalDetails.length - 1];
                  return !(lastDetail && lastDetail.type && lastDetail.value.trim());
                })()}
              >
                + Add Details
              </Button>
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
        onTagsChange={(tags) => {
          setSelectedTags(tags);
          if (!isCreating) {
            handleBackgroundAutoSaveTags(tags);
          }
        }}
        onError={onError}
      />
    </div>
  );
}
