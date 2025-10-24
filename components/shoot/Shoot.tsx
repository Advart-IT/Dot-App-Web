// ShootModal.tsx
'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button } from '@/components/custom-ui/button2';
import SmartInputBox from '@/components/custom-ui/input-box';
import SmartDropdown from '@/components/custom-ui/dropdown-with-add';
import SimpleDropdown from '@/components/custom-ui/dropdown2';
import { useUser } from '@/hooks/usercontext';
import { getProfilesList, type ProfileListItem } from '@/lib/user/user';
import { ShootResponse as BaseShootResponse, createShoot, updateShoot } from '@/lib/shoot/shoot-api';

// Extend ShootResponse to include product_link for frontend type safety
interface ShootResponse extends BaseShootResponse {
  product_link?: string[][];
}

interface ShootModalProps {
  isOpen: boolean;
  onClose: () => void;
  onError: (error: string) => void;
  onRequestDelete?: (shoot: ShootResponse) => void;
  editData?: ShootResponse | null; // Add edit data prop
  reportrixBrands?: string[]; // Add reportrix brands array
}

interface ShootChargerForm {
  type: string;
  value: string;
  paid: boolean; // Add paid status
}

export default function ShootModal({
  isOpen,
  onClose,
  onError,
  onRequestDelete,
  editData = null,
  reportrixBrands = []
}: ShootModalProps) {
  const { user } = useUser();
  const [saving, setSaving] = useState<boolean>(false);
  const [profiles, setProfiles] = useState<ProfileListItem[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // Product Links state (same as Influencer modal)
  const [product_link, setproduct_link] = useState<string[][]>([[""]]);
  // Ref to always hold the latest product_link value
  const productLinkRef = useRef<string[][]>(product_link);
  useEffect(() => {
    productLinkRef.current = product_link;
  }, [product_link]);

  const getValidProductLinks = () => {
    const links = productLinkRef.current;
    if (!links || links.length === 0 || links.every(row => row.length === 0 || row.every(link => !link.trim()))) {
      return [[""]];
    }
    return links;
  };

  // Form state
  const [formData, setFormData] = useState({
    date: '',
    brand: '', // Initialize as empty string
    photographer: '', // Will store profile ID as string
    model: '', // Will store profile ID as string  
    productCovered: '',
    total_hrs: '',
    media_assest: '' // Renamed/used for "Media Assets"
  });

  // Field-level validation errors (for all modes now)
  const [fieldErrors, setFieldErrors] = useState({
    date: '',
    brand: '',
    photographer: '',
    model: '',
    productCovered: '',
    total_hrs: '',
    media_assest: '' // Added error state for media assets
  });

  // Shoot charger form state
  const [shootChargers, setShootChargers] = useState<ShootChargerForm[]>([
    {
      type: '',
      value: '',
      paid: false
    }
  ]);

  // Local state for dynamically added photographer types
  const [localPhotographerTypes, setLocalPhotographerTypes] = useState<string[]>([]);

  // Local state for dynamically added shoot charger types
  const [localShootChargerTypes, setLocalShootChargerTypes] = useState<string[]>([]);

  // Load profiles when modal opens
  useEffect(() => {
    if (isOpen && profiles.length === 0) {
      loadProfiles();
    }
  }, [isOpen]);

  const loadProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const response = await getProfilesList();
      setProfiles(response.profiles);
    } catch (error) {
      console.error('Failed to load profiles:', error);
      onError('Failed to load profiles');
    } finally {
      setLoadingProfiles(false);
    }
  };

  // Track last editData to only reset state when editData changes
  const lastEditIdRef = useRef<number | null>(null);

  // Initialize form when modal opens
  useEffect(() => {
    // Only reset state if editData changes (new shoot or different shoot)
    if (editData?.id !== lastEditIdRef.current) {
      lastEditIdRef.current = editData?.id ?? null;
      setFieldErrors({
        date: '',
        brand: '',
        photographer: '',
        model: '',
        productCovered: '',
        total_hrs: '',
        media_assest: ''
      });
      if (editData) {
        setFormData({
          date: editData.date,
          brand: editData.brand || '',
          photographer: editData.photographer?.toString() || '',
          model: editData.model?.toString() || '',
          productCovered: editData.products_covered || '',
          total_hrs: editData.total_hrs || '',
          media_assest: editData.media_assest || ''
        });
        if (editData.shoot_charges) {
          const chargers = Object.entries(editData.shoot_charges).map(([type, value]) => {
            if (Array.isArray(value) && value.length === 2) {
              return {
                type,
                value: value[0].toString(),
                paid: !!value[1]
              };
            } else {
              // fallback for legacy format
              return {
                type,
                value: value.toString(),
                paid: false
              };
            }
          });
          setShootChargers(chargers.length > 0 ? chargers : [{ type: '', value: '', paid: false }]);
        } else {
          setShootChargers([{ type: '', value: '', paid: false }]);
        }
        // Populate product links from editData if available
        setproduct_link(editData.product_link && Array.isArray(editData.product_link) && editData.product_link.length > 0 ? editData.product_link : [[""]]);
      } else {
        // Reset form to default values for new entry
        setFormData({
          date: '',
          brand: '', // Initialize as empty string
          photographer: '',
          model: '',
          productCovered: '',
          total_hrs: '',
          media_assest: ''
        });
        setShootChargers([{ type: '', value: '', paid: false }]);
        setproduct_link([[""]]); // Reset product links for new entry
      }
    }
  }, [editData, reportrixBrands]);

  // Handle outside click to save and close
  useEffect(() => {
    const handleClickOutside = async (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        // Check if there are unsaved changes *before* attempting validation/save
        if (hasUnsavedChanges()) {
          // Check if form is completely empty (for create mode)
          if (!editData) {
            const isFormEmpty = !formData.date && 
                               !formData.brand && 
                               !formData.photographer && 
                               !formData.model && 
                               !formData.productCovered && 
                               !formData.total_hrs && 
                               !formData.media_assest &&
                               !shootChargers.some(charger => charger.type || charger.value);
            
            if (isFormEmpty) {
              onClose(); // Close without validation if form is completely empty
              return;
            }
          }

          // Apply same validation as handleSubmit here
          const errors = {
            date: formData.date ? '' : 'Date is required',
            brand: formData.brand ? '' : 'Brand is required',
            photographer: formData.photographer ? '' : 'Photographer is required',
            model: formData.model ? '' : 'Model is required',
            productCovered: formData.productCovered ? '' : 'Product Covered is required',
            total_hrs: formData.total_hrs ? '' : 'Total Hours is required',
            media_assest: formData.media_assest ? '' : 'Media Assets is required' // Added validation for media_assest
          };

          const hasErrors = Object.values(errors).some(error => error !== '');
          if (hasErrors) {
             setFieldErrors(errors);
             return; // Do not close or save if validation fails
          }

          // Call handleSubmit inline to avoid dependency issues
          try {
            setSaving(true);
            setFieldErrors({ // Clear errors before attempting save
                date: '',
                brand: '',
                photographer: '',
                model: '',
                productCovered: '',
                total_hrs: '',
                media_assest: '' // Clear media asset error too
            });
            
            const submitData = {
              date: formData.date,
              brand: formData.brand,
              photographer: isNaN(Number(formData.photographer)) ? undefined : Number(formData.photographer),
              model: isNaN(Number(formData.model)) ? undefined : Number(formData.model),
              products_covered: formData.productCovered,
              total_hrs: formData.total_hrs,
              media_assest: formData.media_assest, // Use media_assest field
              shoot_charges: shootChargers.reduce((acc, charger) => {
                if (charger.type && charger.value) {
                  acc[charger.type] = [Number(charger.value) || 0, !!charger.paid];
                }
                return acc;
              }, {} as Record<string, [number, boolean]>),
              product_link: getValidProductLinks() // uses ref
            };

            if (editData) {
              const updateData = { shoot_id: editData.id, ...submitData };
              await updateShoot(updateData);
            } else {
              await createShoot(submitData);
            }
            
            onClose();
          } catch (error) {
            console.error('Error saving shoot on outside click:', error);
            onError(error instanceof Error ? error.message : 'Failed to save shoot');
          } finally {
            setSaving(false);
          }
        } else {
          onClose(); // Just close if no unsaved changes (including when completely empty)
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, formData, editData, shootChargers, product_link, onClose, onError]);

  // Handle form input changes
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing in that specific field
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle shoot charger changes
  const handleShootChargerChange = (index: number, field: keyof ShootChargerForm, value: string) => {
    setShootChargers(prev => {
      const newChargers = [...prev];
      newChargers[index] = { ...newChargers[index], [field]: value };
      return newChargers;
    });
  };

  const addNewShootCharger = () => {
    // Check if the last charger has data before adding a new one
    const lastCharger = shootChargers[shootChargers.length - 1];
    if (lastCharger && (!lastCharger.type || !lastCharger.value)) {
      // Silently return without adding new charger if last one is empty
      return;
    }
    
    setShootChargers(prev => [...prev, {
      type: '',
      value: '',
      paid: false
    }]);
  };

  const removeShootCharger = (index: number) => {
    if (shootChargers.length > 1) {
      const newChargers = shootChargers.filter((_, i) => i !== index);
      setShootChargers(newChargers);
    }
  };

  // Toggle paid status
  const togglePaidStatus = (index: number) => {
    setShootChargers(prev => {
      const newChargers = [...prev];
      newChargers[index] = { ...newChargers[index], paid: !newChargers[index].paid };
      return newChargers;
    });
  };

  // Handle adding new photographer type
  const handleAddNewPhotographer = async (newPhotographerType: string) => {
    try {
      // Add the new photographer type to local state
      setLocalPhotographerTypes(prev => [...prev, newPhotographerType]);
      setFormData(prev => ({
        ...prev,
        photographer: newPhotographerType // Use name as temporary value
      }));
      // Clear error for photographer if it was set
      if (fieldErrors.photographer) {
          setFieldErrors(prev => ({ ...prev, photographer: '' }));
      }
    } catch (error) {
      console.error('Error adding new photographer:', error);
      onError(error instanceof Error ? error.message : 'Failed to add new photographer');
    }
  };

  // Handle adding new shoot charger type
  const handleAddNewShootCharger = async (newShootChargerType: string) => {
    try {
      // Add the new shoot charger type to local state
      setLocalShootChargerTypes(prev => [...prev, newShootChargerType]);
    } catch (error) {
      console.error('Error adding new shoot charger:', error);
      onError(error instanceof Error ? error.message : 'Failed to add new shoot charger');
    }
  };

  // Product Links handlers
  const handleProductLinkChange = (rowIdx: number, colIdx: number, value: string) => {
    setproduct_link(prev => {
      const updated = [...prev];
      updated[rowIdx] = [...updated[rowIdx]];
      updated[rowIdx][colIdx] = value;
      return updated;
    });
  };

  const addProductLinkNext = (rowIdx: number, colIdx: number) => {
    setproduct_link(prev => {
      const updated = [...prev];
      updated[rowIdx] = [...updated[rowIdx], ""];
      return updated;
    });
  };

  const addProductLinkRow = (rowIdx: number) => {
    setproduct_link(prev => {
      const updated = [...prev];
      updated.splice(rowIdx + 1, 0, [""]);
      return updated;
    });
  };

  const removeProductLink = (rowIdx: number, colIdx: number) => {
    setproduct_link(prev => {
      const updated = [...prev];
      updated[rowIdx] = updated[rowIdx].filter((_, c) => c !== colIdx);
      // Ensure there's always at least one empty input field
      if (updated.every(row => row.length === 0)) {
        return [[""]]; // Reset to one empty field if all are removed
      }
      return updated.filter(row => row.length > 0); // Remove empty rows
    });
  };

  // Prepare photographer options from profiles
  const photographerOptions = useMemo(() => {
    // Filter profiles that have "photographer" in their tags
    const photographerProfiles = profiles.filter((profile: ProfileListItem) => 
      profile.tag && Array.isArray(profile.tag) && 
      profile.tag.some((tag: string) => tag.toLowerCase().includes('photographer'))
    );
    
    const profileOptions = photographerProfiles.map((profile: ProfileListItem) => ({
      label: profile.name,
      value: profile.s_no.toString()
    }));
    
    // Add any local photographer types as well
    const localOptions = localPhotographerTypes.map((name: string) => ({
      label: name,
      value: name // For new entries, we'll use name as value temporarily
    }));
    
    return [...profileOptions, ...localOptions];
  }, [profiles, localPhotographerTypes]);

  // Prepare model options from profiles (same as photographer but filter for model tag)
  const modelOptions = useMemo(() => {
    // Filter profiles that have "model" in their tags
    const modelProfiles = profiles.filter((profile: ProfileListItem) => 
      profile.tag && Array.isArray(profile.tag) && 
      profile.tag.some((tag: string) => tag.toLowerCase().includes('model'))
    );
    
    const profileOptions = modelProfiles.map((profile: ProfileListItem) => ({
      label: profile.name,
      value: profile.s_no.toString()
    }));
    
    return profileOptions;
  }, [profiles]);

  // Prepare shoot charger options (global, for all charges)
  const shootChargerOptionsGlobal = useMemo(() => {
    const userShootChargers = user?.dropdowns?.shoot_chargers || [];
    const allShootChargers = [...new Set([...userShootChargers, ...localShootChargerTypes])];
    return allShootChargers.map((item: string) => ({ label: item, value: item }));
  }, [user?.dropdowns?.shoot_chargers, localShootChargerTypes]);

  // For each charge, filter out already selected types
  const getShootChargerOptionsForIndex = (index: number) => {
    const selectedTypes = shootChargers.map((charge, i) => i !== index ? charge.type : null).filter(Boolean);
    return shootChargerOptionsGlobal.filter(opt => !selectedTypes.includes(opt.value));
  };



  // Validate individual fields for required fields (used for both create and update)
  const validateFields = () => {
    const errors = {
      date: formData.date ? '' : 'Date is required',
      brand: formData.brand ? '' : 'Brand is required',
      photographer: formData.photographer ? '' : 'Photographer is required',
      model: formData.model ? '' : 'Model is required',
      productCovered: formData.productCovered ? '' : 'Product Covered is required',
      total_hrs: formData.total_hrs ? '' : 'Total Hours is required',
      media_assest: formData.media_assest ? '' : 'Media Assets is required' // Added validation for media_assest
    };

    setFieldErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Use the shared validation function for required fields
      if (!validateFields()) {
        return; // Stop submission if validation fails, data remains
      }

      setSaving(true);

      // Always use the latest product_link from ref
      const submitData = {
        date: formData.date,
        brand: formData.brand,
        photographer: isNaN(Number(formData.photographer)) ? undefined : Number(formData.photographer),
        model: isNaN(Number(formData.model)) ? undefined : Number(formData.model),
        products_covered: formData.productCovered,
        total_hrs: formData.total_hrs,
        media_assest: formData.media_assest,
        shoot_charges: shootChargers.reduce((acc, charger) => {
          if (charger.type && charger.value) {
            acc[charger.type] = [Number(charger.value) || 0, !!charger.paid];
          }
          return acc;
        }, {} as Record<string, [number, boolean]>),
        product_link: getValidProductLinks() // uses ref
      };

      if (editData) {
        // Update existing shoot
        const updateData = {
          shoot_id: editData.id,
          ...submitData
        };
        await updateShoot(updateData);
      } else {
        // Create new shoot
        await createShoot(submitData);
      }

      // Close the modal after successful submission
      onClose();
    } catch (error) {
      console.error('Error saving shoot:', error);
      if (error instanceof Error && !error.message.includes('required')) {
        onError(error.message);
      } else if (!(error instanceof Error)) {
        onError('Failed to save shoot');
      }
    } finally {
      setSaving(false);
    }
  };

  // Check if form has unsaved changes
  const hasUnsavedChanges = () => {
    if (editData) {
      // For edit mode, check if any field has changed from original data
      return (
        formData.date !== editData.date ||
        formData.brand !== (editData.brand || '') ||
        formData.photographer !== (editData.photographer?.toString() || '') ||
        formData.model !== (editData.model?.toString() || '') ||
        formData.productCovered !== (editData.products_covered || '') ||
        formData.total_hrs !== (editData.total_hrs || '') ||
        formData.media_assest !== (editData.media_assest || '') ||
        JSON.stringify(shootChargers) !== JSON.stringify(
          editData.shoot_charges ? 
            Object.entries(editData.shoot_charges).map(([type, value]) => ({
              type,
              value: value.toString()
            })) : 
            [{ type: '', value: '', paid: false }]
        ) ||
        JSON.stringify(product_link) !== JSON.stringify(editData.product_link || [[""]])
      );
    } else {
      // For new entry, check if any field has data
      return (
        formData.date ||
        formData.brand ||
        formData.photographer ||
        formData.model ||
        formData.productCovered ||
        formData.total_hrs ||
        formData.media_assest || // Check media_assest too
        shootChargers.some(charger => charger.type || charger.value) ||
        product_link.some(row => row.some(link => link))
      );
    }
  };

  // Handle cancel/close - REMOVED THE CONFIRMATION PROMPT
  const handleCancel = () => {
    // if (hasUnsavedChanges()) { // Removed the check and prompt
    //   const confirmClose = confirm('You have unsaved changes. Are you sure you want to close without saving?');
    //   if (!confirmClose) {
    //     return;
    //   }
    // }
    onClose(); // Close directly
  };

  if (!isOpen) return null;
  return (
    <div className="fixed top-0 left-0 w-full h-full z-50 flex items-center justify-center" style={{ backdropFilter: 'blur(8px)', background: 'rgba(30, 30, 30, 0.35)' }}>
      <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-gray-200" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        {/* Modal Header with Brand next to title */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 flex-shrink-0 gap-4 bg-gradient-to-r from-white via-gray-50 to-white rounded-t-2xl">
          <div className="flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-8">
            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight whitespace-nowrap" style={{ letterSpacing: '-0.5px' }}>
              {editData ? 'Edit Shoot' : 'New Shoot'}
            </h2>

            {/* Brand Dropdown */}
            <div className="flex-shrink-0 min-w-[160px]">
              <SimpleDropdown
                options={[
                  { label: 'beelittle', value: 'beelittle' },
                  { label: 'zing', value: 'zing' },
                  { label: 'prathiksham', value: 'prathiksham' },
                  { label: 'adoreaboo', value: 'adoreaboo' },
                ]}
                value={formData.brand}
                onChange={(value) => {
                  const newValue = Array.isArray(value) ? value[0] : value;
                  handleInputChange('brand', newValue);
                }}
                placeholder="Select Brand"
                className={`min-w-[160px] ${fieldErrors.brand ? 'border-red-500' : 'border-gray-300'} bg-white rounded-lg shadow-sm px-2 py-1`}
              />
              {fieldErrors.brand && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.brand}</p>
              )}
            </div>
          </div>

          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-700 transition-colors rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            style={{ background: 'rgba(245,245,245,0.7)' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="px-8 py-7 flex-1 overflow-y-auto bg-white rounded-b-2xl" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          {/* First Line: Date, Total Hours, Photographer, Model Name (4 columns) */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={`w-full h-[40px] px-3 border rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${
                  fieldErrors.date ? 'border-red-500' : 'border-gray-300'
                }`}
                style={{ minHeight: '40px' }}
              />
              {fieldErrors.date && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.date}</p>
              )}
            </div>
            
            <div>
              {loadingProfiles ? (
                <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm text-gray-500">Loading profiles...</span>
                </div>
              ) : (
                <SmartDropdown
                  options={photographerOptions}
                  value={formData.photographer}
                  label='Photographer'
                  onChange={(value) => {
                    const newValue = Array.isArray(value) ? value[0] : value;
                    handleInputChange('photographer', newValue);
                  }}
                  placeholder="Select Photographer"
                  addNewLabel="+ Add Photographer"
                  addNewPlaceholder="Enter new photographer"
                  onAddNew={handleAddNewPhotographer}
                  className={`w-full ${
                    fieldErrors.photographer ? 'border-red-500' : ''
                  }`}
                />
              )}
              {fieldErrors.photographer && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.photographer}</p>
              )}
            </div>
            <div>
              {loadingProfiles ? (
                <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm text-gray-500">Loading profiles...</span>
                </div>
              ) : (
                <SmartDropdown
                  options={modelOptions}
                  value={formData.model}
                  label='Model'
                  onChange={(value) => {
                    const newValue = Array.isArray(value) ? value[0] : value;
                    handleInputChange('model', newValue);
                  }}
                  placeholder="Select Model"
                  enableAddNew={false} // Disable adding new models for now
                  className={`w-full ${
                    fieldErrors.model ? 'border-red-500' : ''
                  }`}
                />
              )}
              {fieldErrors.model && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.model}</p>
              )}
            </div>
            <div>
              <SmartInputBox
                  value={formData.total_hrs}
                  onChange={(value) => {
                    // Only allow numbers and a single decimal point
                    let filtered = value.replace(/[^\d.]/g, '');
                    // Only allow one decimal point
                    const parts = filtered.split('.');
                    if (parts.length > 2) {
                      filtered = parts[0] + '.' + parts.slice(1).join('');
                    }
                    handleInputChange('total_hrs', filtered);
                  }}
                  placeholder="Total Hours (e.g., 8.5)"
                  label="Total Hours"
                  className={`w-full ${fieldErrors.total_hrs ? 'border-red-500' : ''}`}
                />
              {fieldErrors.total_hrs && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.total_hrs}</p>
              )}
            </div>
          </div>

          {/* Second Line: Product Covered and Media Assets in same row */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <SmartInputBox
                value={formData.productCovered}
                onChange={(value) => handleInputChange('productCovered', value)}
                placeholder="Enter product covered"
                label="Product Covered"
                rows={3}
                autoExpand={false}
                maxHeight={72}
                overflowBehavior="scroll"
                textareaClassName={`w-full p-2 border rounded-md resize-none ${fieldErrors.productCovered ? 'border-red-500' : ''}`}
                className=""
              />
              {fieldErrors.productCovered && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.productCovered}</p>
              )}
            </div>
            <div>
              <SmartInputBox
                value={formData.media_assest}
                onChange={(value) => handleInputChange('media_assest', value)}
                placeholder="Enter media assets status"
                label="Media Assets"
                rows={3}
                autoExpand={false}
                maxHeight={72}
                overflowBehavior="scroll"
                textareaClassName={`w-full p-2 border rounded-md resize-none ${fieldErrors.media_assest ? 'border-red-500' : ''}`}
                className=""
              />
              {fieldErrors.media_assest && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.media_assest}</p>
              )}
            </div>
          </div>

          {/* Third Section: Total Hours and Shoot Chargers */}
          <div className="">
            {/* <div className="flex items-end gap-6">
              <div className="w-[475px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours</label>
                <SmartInputBox
                  value={formData.total_hrs}
                  onChange={(value) => handleInputChange('total_hrs', value)}
                  placeholder="Enter total hours (e.g., 8.5)"
                  label=""
                  className={`w-[100px]  ${
                    fieldErrors.total_hrs ? 'border-red-500' : ''
                  }`}
                />
                {fieldErrors.total_hrs && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.total_hrs}</p>
                )}
              </div>
            </div> */}

            {/* Product Links Section - NEWLY ADDED */}
            <div className="mb-6">
              <h3 className="text-[12px] font-medium text-gray-500 mb-1">Product Links</h3>
              <div className="space-y-4">
                {product_link.map((row, rowIdx) => (
                  <div
                    key={rowIdx}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start bg-gray-50 p-4 rounded-lg border border-gray-200"
                  >
                    {row.map((link, colIdx) => (
                      <div
                        key={colIdx}
                        className="relative flex items-center w-full"
                      >
                        <SmartInputBox
                          value={link}
                          onChange={(value) => handleProductLinkChange(rowIdx, colIdx, value)}
                          placeholder={`Product link ${rowIdx * 2 + colIdx + 1}`}
                          label=""
                          className="w-full"
                        />
                        {/* External Link SVG Icon */}
                        <button
                          type="button"
                          className="ml-2 px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs hover:bg-blue-100"
                          style={{ display: 'flex', alignItems: 'center' }}
                          onClick={() => {
                            if (link.trim()) {
                              const url = link.match(/^https?:\/\//) ? link : `https://${link}`;
                              window.open(url, "_blank");
                            }
                          }}
                          tabIndex={-1}
                          aria-label="Open link"
                          disabled={!link.trim()}
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 20, height: 20 }}>
                            <path d="M7.5 3.75H4.16667C3.24619 3.75 2.5 4.49619 2.5 5.41667V15.4167C2.5 16.3371 3.24619 17.0833 4.16667 17.0833H14.1667C15.0871 17.0833 15.8333 16.3371 15.8333 15.4167V12.0833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M13.3333 2.5H17.5V6.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8.33333 11.6667L17.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        {/* Remove Button (for each input) */}
                        <button
                          type="button"
                          className="ml-2 px-2 py-1 rounded bg-red-100 text-red-700 text-xs hover:bg-red-200"
                          onClick={() => removeProductLink(rowIdx, colIdx)}
                        >
                          −
                        </button>
                        {/* Plus Button (only beside the last input of the last row) */}
                        {rowIdx === product_link.length - 1 &&
                          colIdx === row.length - 1 && (
                            <button
                              type="button"
                              className={`ml-2 px-2 py-1 rounded text-xs transition-colors ${!link.trim() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                              onClick={() => addProductLinkNext(rowIdx, colIdx)}
                              disabled={!link.trim()}
                            >
                              +
                            </button>
                          )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Shoot Chargers Section */}
<div className="">
  <h3 className="text-[12px] font-medium text-gray-500 mb-2 flex items-center gap-2">
    Shoot Charges
  </h3>

  <div className="space-y-4">
    {/* Grid for charge cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {shootChargers.map((charge, index) => {
        const optionsForThisCharge = getShootChargerOptionsForIndex(index);
        return (
          <div
            key={index}
            className="relative bg-white border border-gray-200 shadow-sm rounded-xl p-4 transition-all duration-200"
          >
            {/* Remove Button */}
            {shootChargers.length > 1 && (
              <button
                onClick={() => removeShootCharger(index)}
                className="absolute -top-3 -right-3 bg-white border border-gray-300 text-gray-400 hover:text-red-500 rounded-full focus:outline-none w-7 h-7 flex items-center justify-center shadow"
                title="Remove charge"
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}

            {/* Card Content */}
            <div className="flex flex-col gap-3">
              {/* Type and Amount in one line */}
              <div className="flex flex-wrap items-end gap-4">
                {/* Charge Type Dropdown */}
                <div className="flex-1 min-w-[160px]">
                  <SmartDropdown
                    options={optionsForThisCharge}
                    value={charge.type}
                    onChange={(value) => {
                      const newValue = Array.isArray(value) ? value[0] : value;
                      handleShootChargerChange(index, 'type', newValue);
                    }}
                    placeholder="Select Type"
                    enableAddNew={true}
                    label="Charge Type"
                    addNewLabel="+ Add Type"
                    addNewPlaceholder="Enter charge type"
                    onAddNew={handleAddNewShootCharger}
                    className="w-full"
                  />
                </div>

                {/* Amount Input with Paid/Unpaid Badge beside label */}
                <div className="w-36">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-600">
                      Amount (₹)
                    </label>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        charge.paid
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {charge.paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>

                  <SmartInputBox
                    value={charge.value}
                    onChange={(value) => {
                      // Only allow numbers and a single decimal point
                      let filtered = value.replace(/[^\d.]/g, '');
                      const parts = filtered.split('.');
                      if (parts.length > 2) {
                        filtered = parts[0] + '.' + parts.slice(1).join('');
                      }
                      handleShootChargerChange(index, 'value', filtered);
                    }}
                    className="w-full"
                    disabled={charge.type === ''}
                  />
                </div>
              </div>

              {/* Paid Status Toggle */}
              <div className="flex items-center justify-between mt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={charge.paid}
                    onChange={() => togglePaidStatus(index)}
                    className="form-checkbox h-4 w-4 accent-gray-500 border-gray-300 rounded focus:ring-2 focus:ring-gray-300 outline-none"
                  />
                  <span
                    className={`text-sm ${
                      charge.paid ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {charge.paid ? 'Mark as Unpaid' : 'Mark as Paid'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {/* Add New Charge Button */}
  <div className="pt-0">
      <Button
        onClick={addNewShootCharger}
        variant="outline"
        size="s"
        className="w-full flex items-center justify-center gap-2 transition"
        disabled={
          !(
            shootChargers.length > 0 &&
            shootChargers[shootChargers.length - 1].type !== '' &&
            shootChargers[shootChargers.length - 1].value
          )
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        Add New Charge
      </Button>
    </div>
  </div>
</div>



          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-4 px-8 py-5 border-t border-gray-100 bg-gradient-to-r from-white via-gray-50 to-white rounded-b-2xl">
          <div className="flex items-center gap-2 mr-auto">
            <Button
              onClick={handleCancel}
              variant="outline"
              size="m"
              disabled={saving}
            >
              Cancel
            </Button>
            {editData && (
              <Button
                onClick={() => setShowDeleteModal(true)}
                variant="danger"
                size="m"
                disabled={saving}
              >
                Delete
              </Button>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            variant="primary"
            size="m"
            disabled={saving}
          >
            {saving ? 'Saving...' : editData ? 'Update Shoot' : 'Save Shoot'}
          </Button>
          {/* Delete confirmation modal */}
          {showDeleteModal && editData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backdropFilter: 'blur(4px)', background: 'rgba(30,30,30,0.18)' }}>
              <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[320px] border border-gray-200">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Delete Shoot Confirmation</h3>
                <p className="mb-6 text-gray-700">Are you sure you want to delete this shoot for <b>{editData.brand}</b> on {editData.date}?</p>
                <div className="flex justify-end gap-4">
                  <Button variant="outline" size="m" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                  <Button variant="danger" size="m" onClick={() => { setShowDeleteModal(false); onRequestDelete?.(editData); }}>Delete</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}