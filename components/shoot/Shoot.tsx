  // ShootModal.tsx
  'use client';
  import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
  import { Button } from '@/components/custom-ui/button2';
  import SmartInputBox from '@/components/custom-ui/input-box';
  import SmartDropdown from '@/components/custom-ui/dropdown-with-add';
  import SimpleDropdown from '@/components/custom-ui/dropdown2';
  import { useUser } from '@/hooks/usercontext';
  import { getProfilesList, type ProfileListItem, addNewShootChargerType } from '@/lib/user/user';
  import { ShootResponse as BaseShootResponse, createShoot, updateShoot } from '@/lib/shoot/shoot-api';
  // Extend ShootResponse to include product_link for frontend type safety
  interface ShootResponse extends BaseShootResponse {
    product_link?: string[][];
  }
  interface ShootModalProps {
    isOpen: boolean;
    onClose: () => void;
    onError: (error: string) => void;
    // Accept any API response for delete/update (ShootResponse | delete/update API response)
    onRequestDelete?: (response: any) => void;
    // New: callbacks for create and update
    onCreate?: (response: any) => void;
    onUpdate?: (response: any) => void;
    editData?: ShootResponse | null; // Add edit data prop
    reportrixBrands?: string[]; // Add reportrix brands array
  }
  interface ShootChargerForm {
    type: string;
    value: string;
    paid: boolean; // Add paid status
    modelId?: string; // Optional model ID for model charges
    modelName?: string; // Optional model name for model charges
  }
  export default function ShootModal({
    isOpen,
    onClose,
    onError,
    onRequestDelete,
    onCreate,
    onUpdate,
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
    // const [product_link, setproduct_link] = useState<string[][]>([[""]]);
    // Ref to always hold the latest product_link value
    // const productLinkRef = useRef<string[][]>(product_link);
    // useEffect(() => {
    //   productLinkRef.current = product_link;
    // }, [product_link]);
    // const getValidProductLinks = () => {
    //   const links = productLinkRef.current;
    //   if (!links || links.length === 0 || links.every(row => row.length === 0 || row.every(link => !link.trim()))) {
    //     return [[""]];
    //   }
    //   return links;
    // };
    // Form state
    interface ShootFormData {
      date: string;
      brand: string;
      photographer: string;
      model: string[];
      productCovered: string;
      total_hrs: string;
      media_assest: string;
    }
    const [formData, setFormData] = useState<ShootFormData>({
      date: '',
      brand: '', // Initialize as empty string
      photographer: '', // Will store profile ID as string
      model: [], // Will store profile IDs as array for multi-select
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
    // Always reset form state when editData changes
    useEffect(() => {
      console.log('[ShootModal] editData changed:', editData);
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
          model: Array.isArray(editData.model)
            ? editData.model.map(m => m.toString())
            : (editData.model ? [(editData.model as string | number).toString()] : []),
          productCovered: editData.products_covered || '',
          total_hrs: editData.total_hrs || '',
          media_assest: editData.media_assest || ''
        });
        // New logic for shoot_charges with models key
        if (editData.shoot_charges) {
          let chargers: ShootChargerForm[] = [];
          // Add generic Model charge if present
          if (editData.shoot_charges.Model && Array.isArray(editData.shoot_charges.Model)) {
            chargers.push({
              type: 'Model',
              value: editData.shoot_charges.Model[0]?.toString() ?? '',
              paid: !!editData.shoot_charges.Model[1]
            });
          }
          // Add per-model charges if present
          if (editData.shoot_charges.models && typeof editData.shoot_charges.models === 'object') {
            // Map modelName to modelId using model_names and model arrays
            if (Array.isArray(editData.model_names) && Array.isArray(editData.model)) {
              editData.model_names.forEach((modelName: string, idx: number) => {
                const valueArr = (editData.shoot_charges?.models as any)?.[modelName] as any[];
                chargers.push({
                  type: 'model',
                  value: valueArr?.[0]?.toString() ?? '',
                  paid: !!valueArr?.[1],
                  modelName,
                  modelId: editData.model?.[idx]?.toString() ?? ''
                });
              });
            } else {
              Object.entries(editData.shoot_charges.models).forEach(([modelName, valueArr]) => {
                const arr = valueArr as any[];
                chargers.push({
                  type: 'model',
                  value: arr[0]?.toString() ?? '',
                  paid: !!arr[1],
                  modelName,
                  modelId: ''
                });
              });
            }
          }
          // Add other charges (non-model, non-Model, non-models)
          Object.entries(editData.shoot_charges).forEach(([type, value]) => {
            if (type !== 'models' && type !== 'Model') {
              if (Array.isArray(value) && value.length === 2) {
                chargers.push({
                  type,
                  value: value[0].toString(),
                  paid: !!value[1]
                });
              } else {
                chargers.push({
                  type,
                  value: value.toString(),
                  paid: false
                });
              }
            }
          });
          setShootChargers(chargers.length > 0 ? chargers : [{ type: '', value: '', paid: false }]);
        } else {
          setShootChargers([{ type: '', value: '', paid: false }]);
        }
        // Populate product links from editData if available
        // setproduct_link(editData.product_link && Array.isArray(editData.product_link) && editData.product_link.length > 0 ? editData.product_link : [[""]]);
      } else {
        // Reset form to default values for new entry
        setFormData({
          date: '',
          brand: '', // Initialize as empty string
          photographer: '',
          model: [],
          productCovered: '',
          total_hrs: '',
          media_assest: ''
        });
        setShootChargers([{ type: '', value: '', paid: false }]);
        // setproduct_link([[""]]); // Reset product links for new entry
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
              model: formData.model && formData.model.length > 0 ? '' : 'Model is required',
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
                model: Array.isArray(formData.model)
                  ? formData.model.map(m => isNaN(Number(m)) ? undefined : Number(m)).filter(m => m !== undefined)
                  : (formData.model ? [Number(formData.model)] : []),
                products_covered: formData.productCovered,
                total_hrs: formData.total_hrs,
                media_assest: formData.media_assest, // Use media_assest field
                shoot_charges: shootChargers.reduce((acc, charger) => {
                  if (charger.type && charger.value) {
                    acc[charger.type] = [Number(charger.value) || 0, !!charger.paid];
                  }
                  return acc;
                }, {} as Record<string, [number, boolean]>),
                // product_link: getValidProductLinks() // uses ref
              };
              if (editData) {
                // Update the shoot data and trigger the update callback
                const response = await updateShoot({
                  ...submitData,
                  shoot_id: editData.id
                });
                if (onUpdate) {
                  onUpdate(response);
                }
                onClose();
              } else {
                const response = await createShoot(submitData);
                if (onCreate) {
                  onCreate(response);
                }
                onClose();
              }
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
    }, [isOpen, formData, editData, shootChargers, /*product_link,*/ onClose, onError]);
    // Handle form input changes
    const handleInputChange = (field: keyof ShootFormData, value: any) => {
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
        const isModelCharge = index < (formData.model?.length || 0);
        const currentCharge = newChargers[index];
        if (isModelCharge) {
          // For model charges
          if (field === 'type') {
            // Don't allow changing type for model charges
            return prev;
          } else {
            // Get the model ID and name for this charge
            const modelId = formData.model[index];
            const modelOption = modelOptions.find(opt => opt.value === modelId);
            const modelName = modelOption?.label || '';
            // Update the value or paid status while preserving model info
            newChargers[index] = {
              ...currentCharge,
              type: 'model', // Ensure type stays as 'model'
              modelId, // Keep model ID
              modelName, // Keep model name
              [field]: field === 'value' ? value : currentCharge[field]
            };
          }
        } else {
          // For non-model charges, update normally
          newChargers[index] = {
            ...currentCharge,
            [field]: value
          };
        }
        return newChargers;
      });
    };
    const addNewShootCharger = () => {
      setShootChargers(prev => {
        // Get the non-model charges section
        const modelChargesCount = formData.model?.length || 0;
        const nonModelChargers = prev.slice(modelChargesCount);
        // Only add new card if the last non-model card has data
        const lastNonModelCharger = nonModelChargers[nonModelChargers.length - 1];
        if (lastNonModelCharger && (!lastNonModelCharger.type || !lastNonModelCharger.value)) {
          return prev; // Don't add if last card is empty
        }
        // Keep model charges intact and add new empty card at the end
        return [
          ...prev.slice(0, modelChargesCount), // Keep model charges
          ...prev.slice(modelChargesCount), // Keep existing non-model charges
          { type: '', value: '', paid: false } // Add new empty card
        ];
      });
    };
    const removeShootCharger = (index: number) => {
      if (shootChargers.length > 1) {
        setShootChargers(prev => {
          // Don't allow removing model charges from the beginning
          const isModelCharge = index < (formData.model?.length || 0);
          if (isModelCharge) {
            return prev;
          }
          // For non-model charges, remove only the specific card while preserving others
          const nonModelStartIndex = formData.model?.length || 0;
          // Separate model and non-model charges
          const modelCharges = prev.slice(0, nonModelStartIndex);
          const nonModelCharges = prev.slice(nonModelStartIndex);
          // Remove the card from non-model charges (adjusting index)
          const adjustedIndex = index - nonModelStartIndex;
          const updatedNonModelCharges = nonModelCharges.filter((_, i) => i !== adjustedIndex);
          // If all non-model charges would be removed, keep the last one with its values
          if (updatedNonModelCharges.length === 0) {
            const lastCard = nonModelCharges[nonModelCharges.length - 1];
            return [...modelCharges, lastCard];
          }
          // Combine model charges with updated non-model charges
          return [...modelCharges, ...updatedNonModelCharges];
        });
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
        // Optimistically add to local state for instant UI feedback
        setLocalShootChargerTypes(prev => [...prev, newShootChargerType]);
        // Save to backend
        await addNewShootChargerType(newShootChargerType);
        // Optionally, update user context dropdowns if needed (not shown here)
      } catch (error) {
        console.error('Error adding new shoot charger:', error);
        onError(error instanceof Error ? error.message : 'Failed to add new shoot charger');
      }
    };
    // Product Links handlers
    // const handleProductLinkChange = (rowIdx: number, colIdx: number, value: string) => {
    //   setproduct_link(prev => {
    //     const updated = [...prev];
    //     updated[rowIdx] = [...updated[rowIdx]];
    //     updated[rowIdx][colIdx] = value;
    //     return updated;
    //   });
    // };
    // const addProductLinkNext = (rowIdx: number, colIdx: number) => {
    //   setproduct_link(prev => {
    //     const updated = [...prev];
    //     updated[rowIdx] = [...updated[rowIdx], ""];
    //     return updated;
    //   });
    // };
    // const addProductLinkRow = (rowIdx: number) => {
    //   setproduct_link(prev => {
    //     const updated = [...prev];
    //     updated.splice(rowIdx + 1, 0, [""]);
    //     return updated;
    //   });
    // };
    // const removeProductLink = (rowIdx: number, colIdx: number) => {
    //   setproduct_link(prev => {
    //     const updated = [...prev];
    //     updated[rowIdx] = updated[rowIdx].filter((_, c) => c !== colIdx);
    //     // Ensure there's always at least one empty input field
    //     if (updated.every(row => row.length === 0)) {
    //       return [[""]]; // Reset to one empty field if all are removed
    //     }
    //     return updated.filter(row => row.length > 0); // Remove empty rows
    //   });
    // };
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
    // Select 'model' by default in model dropdown if available
    useEffect(() => {
      if (isOpen && modelOptions.length > 0 && !formData.model.length) {
        // If there is a model with label 'model', select it by default
        const defaultModel = modelOptions.find(opt => opt.label.toLowerCase() === 'model');
        if (defaultModel) {
          setFormData(prev => ({ ...prev, model: [defaultModel.value] }));
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, modelOptions]);
    // Handle model selection changes and update shoot charges accordingly
    useEffect(() => {
      // Use functional setter to operate on latest state and avoid stale closures
      setShootChargers(prev => {
        const modelIds: string[] = formData.model || [];
        // Build map of existing model charges by modelId (if present)
        const existingModelMap = new Map<string, ShootChargerForm>();
        prev.forEach(c => {
          if (c.type === 'model' && c.modelId) {
            existingModelMap.set(c.modelId, c);
          }
        });
        // Preserve all non-model charges exactly as they are
        const otherCharges = prev.filter(c => c.type !== 'model');
        // If no models selected, just return otherCharges (or one empty card)
        if (!modelIds || modelIds.length === 0) {
          const final = otherCharges.length > 0 ? otherCharges : [{ type: '', value: '', paid: false }];
          // Only update if something would change
          if (JSON.stringify(prev) !== JSON.stringify(final)) return final;
          return prev;
        }
        // Build ordered model charge cards based on selected model IDs
        const modelCharges = modelIds.map(modelId => {
          const modelOption = modelOptions.find(opt => opt.value === modelId);
          const modelName = modelOption?.label || '';
          const existing = existingModelMap.get(modelId);
          if (existing) {
            // Preserve existing values (amount, paid) and ensure modelId/name/type are correct
            return { ...existing, modelId, modelName, type: 'model' } as ShootChargerForm;
          }
          // New model charge card
          return { type: 'model', value: '', paid: false, modelId, modelName } as ShootChargerForm;
        });
        const combined = [...modelCharges, ...(otherCharges.length > 0 ? otherCharges : [{ type: '', value: '', paid: false }])];
        // Avoid unnecessary state updates
        if (JSON.stringify(prev) === JSON.stringify(combined)) return prev;
        return combined;
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.model, modelOptions]); // Include modelOptions to get model names
    // Prepare shoot charger options (global, for all charges)
    const shootChargerOptionsGlobal = useMemo(() => {
      const userShootChargers = user?.dropdowns?.shoot_chargers || [];
      // Merge user shoot chargers and local types, deduplicated
      const allTypes = Array.from(new Set([...userShootChargers, ...localShootChargerTypes]));
      return allTypes.map((item: string) => ({ label: item, value: item }));
    }, [user?.dropdowns?.shoot_chargers, localShootChargerTypes]);
    // For each charge, filter out already selected types, but always include the current charge's type
    const getShootChargerOptionsForIndex = (index: number) => {
      const selectedTypes = shootChargers.map((charge, i) => i !== index ? charge.type : null).filter(Boolean);
      let options = shootChargerOptionsGlobal.filter(opt => !selectedTypes.includes(opt.value));
      const currentType = shootChargers[index]?.type;
      if (currentType && !options.some(opt => opt.value === currentType)) {
        options = [{ label: currentType, value: currentType }, ...options];
      }
      return options;
    };
    // Validate individual fields for required fields (used for both create and update)
    const validateFields = () => {
      const errors = {
        date: formData.date ? '' : 'Date is required',
        brand: formData.brand ? '' : 'Brand is required',
        photographer: formData.photographer ? '' : 'Photographer is required',
        model: formData.model && formData.model.length > 0 ? '' : 'Model is required',
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
        if (!validateFields()) {
          return;
        }
        setSaving(true);
        let normalizedPhotographer: number | undefined = undefined;
        if (Array.isArray(formData.photographer)) {
          const val = formData.photographer[0];
          normalizedPhotographer = isNaN(Number(val)) ? undefined : Number(val);
        } else {
          normalizedPhotographer = isNaN(Number(formData.photographer)) ? undefined : Number(formData.photographer);
        }
        let normalizedModel: number[] = [];
        if (Array.isArray(formData.model)) {
          normalizedModel = formData.model.map(m => Number(m)).filter(m => !isNaN(m));
        } else if (formData.model) {
          const m = Number(formData.model);
          if (!isNaN(m)) normalizedModel = [m];
        }
        const shootChargesObj: Record<string, any> = {};
        if (normalizedModel.length > 0) {
          shootChargesObj.models = {};
          shootChargers.forEach((charge) => {
            if (charge.type === 'model' && charge.modelId && charge.modelName) {
              shootChargesObj.models[charge.modelName] = [Number(charge.value) || 0, !!charge.paid];
            }
          });
        }
        shootChargers.forEach((charger) => {
          if (charger.type && charger.type !== 'model') {
            shootChargesObj[charger.type] = [Number(charger.value) || 0, !!charger.paid];
          }
        });
        // Always include start_date and end_date for current month/year
    const now = new Date();
    const start_date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const end_date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        const submitData = {
          date: formData.date,
          brand: formData.brand,
          photographer: normalizedPhotographer,
          model: normalizedModel,
          products_covered: formData.productCovered,
          total_hrs: formData.total_hrs,
          media_assest: formData.media_assest,
          // product_link: getValidProductLinks(),
          shoot_charges: shootChargesObj,
          start_date,
          end_date
        };
        if (editData) {
          // Use getChangedShootFields to build minimal update payload
          const { getChangedShootFields } = await import('../../lib/shoot/shoot-api');
          const updatePayload = getChangedShootFields(editData, submitData, editData.id);
          if (Object.keys(updatePayload).length > 1) { // shoot_id is always present
            const response = await updateShoot(updatePayload);
            onUpdate?.(response);
          }
        } else {
          // For create, always include shoot_charges
          const { createShoot } = await import('../../lib/shoot/shoot-api');
          const response = await createShoot(submitData);
          onCreate?.(response);
        }
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
          JSON.stringify(formData.model) !== JSON.stringify(Array.isArray(editData.model)
            ? editData.model.map(m => m.toString())
            : (editData.model ? [(editData.model as string | number).toString()] : [])) ||
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
          // JSON.stringify(product_link) !== JSON.stringify(editData.product_link || [[""]])
          false // Always return false for product_link comparison since it's commented out
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
          // || product_link.some(row => row.some(link => link)) // Comment out product_link check
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
              <div className='flex flex-row' >
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
                  className={`min-w-[160px] ${fieldErrors.brand ? '' : 'border-gray-300'} bg-white rounded-lg shadow-sm px-2 py-1`}
                />
              </div>
              <div>
                {fieldErrors.brand && (
                  <p className="text-red-500 text-xs mt-4 ml-2">{fieldErrors.brand}</p>
                )}
              </div>
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
                <label className="block text-xs text-gray-500 mb-1">Date <span className='' > *</span></label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={`w-full h-[40px] px-3 border rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${
                    fieldErrors.date ? '' : 'border-gray-300'
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
                    label='Photographer *'
                    onChange={(value) => {
                      const newValue = Array.isArray(value) ? value[0] : value;
                      handleInputChange('photographer', newValue);
                    }}
                    placeholder="Select Photographer"
                    addNewLabel="+ Add Photographer"
                    addNewPlaceholder="Enter new photographer"
                    onAddNew={handleAddNewPhotographer}
                    className={`w-full ${
                      fieldErrors.photographer ? '' : ''
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
                  <>
                    <SmartDropdown
                      options={modelOptions}
                      value={formData.model}
                      label='Model *'
                      onChange={(value) => {
                        // Always set as array for multi-select
                        const newValue = Array.isArray(value) ? value : [value];
                        handleInputChange('model', newValue);
                      }}
                      placeholder="Select Model(s)"
                      enableAddNew={false}
                      multiSelector={true}
                      className={`w-full ${
                        fieldErrors.model ? '' : ''
                      }`}
                    />
                  </>
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
                    label="Total Hours *"
                    className={`w-full ${fieldErrors.total_hrs ? '' : ''}`}
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
                  label="Product Covered *"
                  rows={3}
                  enableLink={true}
                  autoExpand={false}
                  maxHeight={72}
                  overflowBehavior="scroll"
                  textareaClassName={`w-full p-2 border rounded-md resize-none ${fieldErrors.productCovered ? '' : ''}`}
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
                  label="Media Assets *"
                  enableLink={true}
                  rows={3}
                  autoExpand={false}
                  maxHeight={72}
                  overflowBehavior="scroll"
                  textareaClassName={`w-full p-2 border rounded-md resize-none ${fieldErrors.media_assest ? '' : ''}`}
                  className=""
                />

                {/* Note below input */}
                <p className="text-[12px] text-gray-500 mt-1">
                  <span className="font-medium text-red-500 text-[12px]">Note : Ensure to mention the right folder / link.</span>
                </p>

                {/* Error message */}
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
              {/* <div className="mb-6">
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
                          {/* <button
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
                          </button> */}
                          {/* Remove Button (for each input) */}
                          {/* <button
                            type="button"
                            className="ml-2 px-2 py-1 rounded bg-red-100 text-red-700 text-xs hover:bg-red-200"
                            onClick={() => removeProductLink(rowIdx, colIdx)}
                          >
                            −
                          </button> */}
                          {/* Plus Button (only beside the last input of the last row) */}
                          {/* {rowIdx === product_link.length - 1 &&
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
              </div> */}
  <div className="">
    <h3 className="text-[12px] font-medium text-gray-500 mb-2 flex items-center gap-2">
      Shoot Charges
    </h3>
    <div className="space-y-4">
      {/* Grid for charge cards - always show at least one card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Model charge cards */}
        {formData.model.map((mid, index) => {
          const modelObj = modelOptions.find(opt => opt.value === mid);
          // Always set charge type to 'model' for model cards
          const charge = shootChargers[index] || { type: 'model', value: '', paid: false };
          // If not already 'model', set it
          if (charge.type !== 'model') {
            setTimeout(() => handleShootChargerChange(index, 'type', 'model'), 0);
          }
          return (
            <div
              key={mid}
              className="relative bg-white border border-gray-200 shadow-sm rounded-xl p-4 transition-all duration-200"
            >
              {/* Card Content */}
              <div className="flex flex-col gap-3">
                {/* Charge Type Dropdown - fixed to 'model' and disabled */}
                <div className="flex flex-wrap items-end gap-4">
                  {/* Charge Type Dropdown */}
                  <div className="flex-1 min-w-[160px]">
                    <SmartDropdown
                      options={[{ label: 'model', value: 'model' }]}
                      value={'model'}
                      onChange={() => {}}
                      placeholder="Select Type"
                      enableAddNew={false}
                      label="Charge Type"
                      className="w-full"
                      disabled={true}
                    />
                  </div>
                  {/* Amount Input with Paid/Unpaid Badge beside label, aligned to top */}
                  <div className="w-36 flex flex-col justify-start">
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
                        let filtered = value.replace(/[^\d.]/g, '');
                        const parts = filtered.split('.');
                        if (parts.length > 2) {
                          filtered = parts[0] + '.' + parts.slice(1).join('');
                        }
                        handleShootChargerChange(index, 'value', filtered);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
                {/* Model name as a separate row below the charge type + amount row, with reduced upper and lower gap */}
                <div className="text-[12px] text-gray-600 font-medium leading-tight mt-[2px] ml-1">{modelObj?.label || mid}</div>
                {/* Paid Status Toggle, remove top margin for tighter layout */}
                <div className="flex items-center justify-between mt-0">
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
        {/* Other Charges cards (always at least one, even if model cards exist) */}
        {(() => {
          const otherCharges = shootChargers.slice(formData.model.length);
          // Always show at least one blank card if none exist
          const displayCharges = otherCharges.length > 0 ? otherCharges : [{ type: '', value: '', paid: false }];
          return displayCharges.map((charge, idx) => {
            const chargeIndex = formData.model.length + idx;
            return (
              <div
                key={`other-charge-${chargeIndex}`}
                className="relative bg-white border border-gray-200 shadow-sm rounded-xl p-4 transition-all duration-200"
              >
                {/* No heading for Other Charge */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[160px]">
                      <SmartDropdown
                        options={shootChargerOptionsGlobal.filter(opt => opt.value !== 'model')}
                        value={charge.type || ''}
                        onChange={(value) => {
                          const newValue = Array.isArray(value) ? value[0] : value;
                          handleShootChargerChange(chargeIndex, 'type', newValue);
                        }}
                        placeholder="Select Type"
                        enableAddNew={true}
                        addNewLabel={"+ Add New Charge Type"}
                        addNewPlaceholder={"Enter new charge type"}
                        onAddNew={handleAddNewShootCharger}
                        label="Charge Type"
                        className="w-full"
                      />
                    </div>
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
                        disabled={!charge.type}
                        onChange={(value) => {
                          let filtered = value.replace(/[^\d.]/g, '');
                          const parts = filtered.split('.');
                          if (parts.length > 2) {
                            filtered = parts[0] + '.' + parts.slice(1).join('');
                          }
                          handleShootChargerChange(chargeIndex, 'value', filtered);
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={charge.paid}
                        onChange={() => togglePaidStatus(chargeIndex)}
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
          });
        })()}
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
                    <Button
                      variant="danger"
                      size="m"
                      onClick={async () => {
                        setShowDeleteModal(false);
                        if (editData) {
                          try {
                            setSaving(true);
                            // Only call updateShoot once, using the top-level import
                            const response = await updateShoot({ shoot_id: editData.id, is_delete: true });
                            onRequestDelete?.(response);
                          } catch (error) {
                            console.error('Delete error:', error);
                            onError(error instanceof Error ? error.message : 'Failed to delete shoot');
                          } finally {
                            setSaving(false);
                            onClose();
                          }
                        } else {
                          onClose();
                        }
                      }}
                      disabled={saving}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }