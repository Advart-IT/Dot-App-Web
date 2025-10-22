// ShootModal.tsx
'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button } from '@/components/custom-ui/button2';
import SmartInputBox from '@/components/custom-ui/input-box';
import SmartDropdown from '@/components/custom-ui/dropdown-with-add';
import SimpleDropdown from '@/components/custom-ui/dropdown2';
import { useUser } from '@/hooks/usercontext';
import { getProfilesList, type ProfileListItem } from '@/lib/user/user';
import { ShootResponse, createShoot, updateShoot } from '@/lib/shoot/shoot-api';

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
      value: ''
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

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Clear field errors when modal opens
      setFieldErrors({
        date: '',
        brand: '',
        photographer: '',
        model: '',
        productCovered: '',
        total_hrs: '',
        media_assest: '' // Clear media asset error too
      });

      if (editData) {
        // Populate form with edit data
        setFormData({
          date: editData.date,
          brand: editData.brand || '',
          photographer: editData.photographer?.toString() || '',
          model: editData.model?.toString() || '',
          productCovered: editData.products_covered || '',
          total_hrs: editData.total_hrs || '',
          media_assest: editData.media_assest || ''
        });
        
        // Populate shoot charges
        if (editData.shoot_charges) {
          const chargers = Object.entries(editData.shoot_charges).map(([type, value]) => ({
            type,
            value: value.toString()
          }));
          setShootChargers(chargers.length > 0 ? chargers : [{ type: '', value: '' }]);
        } else {
          setShootChargers([{ type: '', value: '' }]);
        }
        

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
        setShootChargers([{ type: '', value: '' }]);
      }
    }
  }, [isOpen, editData, reportrixBrands]);

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
                  acc[charger.type] = Number(charger.value) || 0;
                }
                return acc;
              }, {} as Record<string, number>)
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
  }, [isOpen, formData, editData, shootChargers, onClose, onError]);

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
      value: ''
    }]);
  };

  const removeShootCharger = (index: number) => {
    if (shootChargers.length > 1) {
      const newChargers = shootChargers.filter((_, i) => i !== index);
      setShootChargers(newChargers);
    }
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

  // Prepare shoot charger options
  const shootChargerOptions = useMemo(() => {
    const userShootChargers = user?.dropdowns?.shoot_chargers || [];
    const allShootChargers = [...new Set([...userShootChargers, ...localShootChargerTypes])];
    return allShootChargers.map((item: string) => ({ label: item, value: item }));
  }, [user?.dropdowns?.shoot_chargers, localShootChargerTypes]);



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

      // Prepare data for API - convert photographer and model to numbers if they are profile IDs
      const submitData = {
        date: formData.date,
        brand: formData.brand, // Use brand from form data
        photographer: isNaN(Number(formData.photographer)) ? undefined : Number(formData.photographer),
        model: isNaN(Number(formData.model)) ? undefined : Number(formData.model),
        products_covered: formData.productCovered,
        total_hrs: formData.total_hrs,
        media_assest: formData.media_assest, // Use media_assest field
        shoot_charges: shootChargers.reduce((acc, charger) => {
          if (charger.type && charger.value) {
            acc[charger.type] = Number(charger.value) || 0;
          }
          return acc;
        }, {} as Record<string, number>)
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
      // Only call parent's onError for non-validation errors (e.g., API/network issues)
      // For validation errors, fieldErrors are already set by validateFields()
      if (error instanceof Error && !error.message.includes('required')) { // Example: refine condition if needed
          onError(error.message);
      } else if (!(error instanceof Error)) {
          onError('Failed to save shoot');
      }
      // If validation failed within the API call itself (unlikely with frontend check),
      // you might need specific error handling from your API response here.
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
            [{ type: '', value: '' }]
        )
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
        shootChargers.some(charger => charger.type || charger.value)
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
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div ref={modalRef} className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {editData ? 'Edit Shoot' : 'New Shoot'}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* First Line: Date, Brand, Photographer, Model Name */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.date && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.date}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <SimpleDropdown
                options={[{ label: 'beelittle', value: 'beelittle' }, { label: 'zing', value: 'zing' }, { label: 'prathiksham', value: 'prathiksham' }, { label: 'adoreaboo', value: 'adoreaboo' }]}
                value={formData.brand}
                onChange={(value) => {
                  const newValue = Array.isArray(value) ? value[0] : value;
                  handleInputChange('brand', newValue);
                }}
                placeholder="Select Brand"
                className={`w-full ${fieldErrors.brand ? 'border-red-500' : ''}`}
              />
              {fieldErrors.brand && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.brand}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photographer</label>
              {loadingProfiles ? (
                <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm text-gray-500">Loading profiles...</span>
                </div>
              ) : (
                <SmartDropdown
                  options={photographerOptions}
                  value={formData.photographer}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              {loadingProfiles ? (
                <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm text-gray-500">Loading profiles...</span>
                </div>
              ) : (
                <SmartDropdown
                  options={modelOptions}
                  value={formData.model}
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
          </div>

          {/* Second Line: Product Covered, Total Hours, Media Assets */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Covered</label>
              <SmartInputBox
                value={formData.productCovered}
                onChange={(value) => handleInputChange('productCovered', value)}
                placeholder="Enter product covered"
                label=""
                className={`${
                  fieldErrors.productCovered ? 'border-red-500' : ''
                }`}
              />
              {fieldErrors.productCovered && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.productCovered}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours</label>
              <SmartInputBox
                value={formData.total_hrs}
                onChange={(value) => handleInputChange('total_hrs', value)}
                placeholder="Enter total hours (e.g., 8.5)"
                label=""
                className={`${
                  fieldErrors.total_hrs ? 'border-red-500' : ''
                }`}
              />
              {fieldErrors.total_hrs && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.total_hrs}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Media Assets</label> {/* Changed label */}
              <SmartInputBox
                value={formData.media_assest}
                onChange={(value) => handleInputChange('media_assest', value)}
                placeholder="Enter media assets status"
                label=""
                className={`${
                  fieldErrors.media_assest ? 'border-red-500' : ''
                }`}
              />
              {fieldErrors.media_assest && ( // Added error display
                <p className="text-red-500 text-xs mt-1">{fieldErrors.media_assest}</p>
              )}
            </div>
          </div>

          {/* Third Section: Shoot Chargers */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Shoot Chargers</h3>
            <div className="space-y-3">
              {shootChargers.map((charger, index) => {
                const isEvenIndex = index % 2 === 0;
                // Only render the row for even indices or when it's the last item and odd
                if (!isEvenIndex) return null;

                const nextCharger = shootChargers[index + 1];

                return (
                  <div key={`charger-row-${Math.floor(index / 2)}`} className="grid grid-cols-2 gap-6">
                    {/* First Charger in the Row */}
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-5">
                          <SmartDropdown
                            options={shootChargerOptions}
                            value={charger.type}
                            onChange={(value) => {
                              const newValue = Array.isArray(value) ? value[0] : value;
                              handleShootChargerChange(index, 'type', newValue);
                            }}
                            placeholder="Select Type"
                            enableAddNew={true}
                            addNewLabel="+ Add Type"
                            addNewPlaceholder="Enter charger type"
                            onAddNew={handleAddNewShootCharger}
                            className="w-full"
                          />
                        </div>
                        <div className="col-span-5">
                          <SmartInputBox
                            value={charger.value}
                            onChange={(value) => handleShootChargerChange(index, 'value', value)}
                            placeholder="Enter amount"
                            label=""
                          />
                        </div>
                        <div className="col-span-2 flex items-end pb-1">
                          {shootChargers.length > 1 && (
                            <Button
                              onClick={() => removeShootCharger(index)}
                              variant="outline"
                              size="s"
                              className="w-full h-[35px]"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Second Charger in the Row (if exists) */}
                    {nextCharger && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-5">
                            <SmartDropdown
                              options={shootChargerOptions}
                              value={nextCharger.type}
                              onChange={(value) => {
                                const newValue = Array.isArray(value) ? value[0] : value;
                                handleShootChargerChange(index + 1, 'type', newValue);
                              }}
                              placeholder="Select Type"
                              enableAddNew={true}
                              addNewLabel="+ Add Type"
                              addNewPlaceholder="Enter charger type"
                              onAddNew={handleAddNewShootCharger}
                              className="w-full"
                            />
                          </div>
                          <div className="col-span-5">
                            <SmartInputBox
                              value={nextCharger.value}
                              onChange={(value) => handleShootChargerChange(index + 1, 'value', value)}
                              placeholder="Enter amount"
                              label=""
                            />
                          </div>
                          <div className="col-span-2 flex items-end pb-1">
                            {shootChargers.length > 1 && (
                              <Button
                                onClick={() => removeShootCharger(index + 1)}
                                variant="outline"
                                size="s"
                                className="w-full h-[35px]"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              <div className="mt-4">
                <Button
                  onClick={addNewShootCharger}
                  variant="outline"
                  size="s"
                  className="w-full"
                >
                  + Add Shoot Charger
                </Button>
              </div>
            </div>
          </div>


        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
            onClick={handleCancel}
            variant="outline"
            size="m"
            disabled={saving}
            style={{ order: 1 }}
          >
            Cancel
          </Button>
          {editData && (
            <Button
              onClick={() => setShowDeleteModal(true)}
              variant="danger"
              size="m"
              disabled={saving}
              style={{ order: 2, marginRight: 'auto' }}
            >
              Delete
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            variant="primary"
            size="m"
            disabled={saving}
            style={{ order: 3 }}
          >
            {saving ? 'Saving...' : editData ? 'Update Shoot' : 'Save Shoot'}
          </Button>
          {/* Delete confirmation modal */}
          {showDeleteModal && editData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-xl p-6 min-w-[320px]">
                <h3 className="text-lg font-semibold mb-4">Delete Shoot Confirmation</h3>
                <p className="mb-6">Are you sure you want to delete this shoot for <b>{editData.brand}</b> on {editData.date}?</p>
                <div className="flex justify-end gap-3">
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