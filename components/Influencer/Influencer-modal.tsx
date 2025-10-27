import React, { useState, useRef, useEffect } from "react";
import InfoPermissionModal from "@/components/custom-ui/InfoPermissionModal";
import { insertInfluencer } from '@/lib/Influencer/Influencer';
import SmartDropdown from "@/components/custom-ui/dropdown-with-add";
import SmartInputBox from "@/components/custom-ui/input-box";
import { Button } from "@/components/custom-ui/button2";

// Define types for the form data and options if not already defined elsewhere
interface Option {
  label: string;
  value: string;
}

interface InfluencerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (arg0: any) => void;
  influencerOptions: Option[];
  statusOptions: Option[];
  colabOptions: Option[];
  productStatusOptions: Option[];
  editData?: any; // InfluencerTableRow | null
  currentTab?: string;
  isCreator?: boolean;
}

interface FormData {
  influencer: string;
  status: string;
  workflowStatus: string;
  postDueDate: string;
  colab: string;
  productStatus: string;
  deliverable: string;
  concept: string;
  amount: string;
  markPaid: boolean;
  returnReceived: boolean;
  returnDate: string;
  size: string;
  contractLink: string;
  performance: string;
  feedback: string;
  reelsRating?: number;
  storyRating?: number;
  adRights?: string;
  performanceDropdown?: string;
  performanceCheckbox?: boolean;
  performanceCheckboxViews?: boolean;
  performanceCheckboxComments?: boolean;
  brad?: string; // Add brand field
  // views?: boolean;
  // comment?: boolean; // Change to boolean type
  comments?: string; // Change to string type
}

interface FieldErrors {
  influencer: string;
  status: string;
  colab: string;
  productStatus: string;
  deliverable: string;
  concept: string;
  size: string;
  contractLink: string;
  brad: string; // Add error field for brand
}

export default function InfluencerModal({
  isOpen,
  onClose,
  onCreate,
  influencerOptions,
  statusOptions,
  colabOptions,
  productStatusOptions,
  editData = null,
  currentTab = '',
  isCreator = false,
}: InfluencerModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<FormData>({
    influencer: "",
    status: "",
    workflowStatus: "",
    postDueDate: "",
    colab: "",
    productStatus: "",
    deliverable: "",
    concept: "",
    amount: "",
    markPaid: false,
    returnReceived: false,
    returnDate: "",
    size: "",
    contractLink: "",
    performance: "",
    feedback: "",
    reelsRating: 0,
    storyRating: 0,
    adRights: "no",
    performanceDropdown: "",
    performanceCheckbox: false,
    performanceCheckboxViews: false,
    performanceCheckboxComments: false,
    // views: false,
    // comment: false,
    comments: "",
  });
  const [productLinks, setProductLinks] = useState<string[][]>([[""]]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    influencer: "",
    status: "",
    colab: "",
    productStatus: "",
    deliverable: "",
    concept: "",
    size: "",
    contractLink: "",
    brad: "" // Initialize brand error
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [barterItems, setBarterItems] = useState<string[]>([""]);
  const [changesRequiredComment, setChangesRequiredComment] = useState("");
  const [showChangesRequiredComment, setShowChangesRequiredComment] = useState(false); // State to show/hide comment section


  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({
      influencer: "",
      status: "",
      colab: "",
      productStatus: "",
      deliverable: "",
      concept: "",
      size: "",
      contractLink: "",
      brad: "" // Reset brand error
    });
    if (editData) {
      setFormData({
        influencer: editData.influencer_id ? String(editData.influencer_id) : "",
        status: editData.status ?? "",
        workflowStatus: editData.workflow_status ?? "",
        postDueDate: editData.post_due_date ? (typeof editData.post_due_date === "string" ? editData.post_due_date.slice(0, 10) : "") : "",
        colab: editData.colab_type ?? "",
        productStatus: editData.product_status ?? "",
        deliverable: editData.deliverable_details ?? "",
        concept: editData.concept ?? "",
        amount: editData.payment_json?.amount ? String(editData.payment_json.amount) : "",
        markPaid: !!editData.payment_json?.paid,
        returnReceived: !!editData.return_received?.received,
        returnDate: editData.return_received?.date ?? "",
        size: editData.size ?? "",
        contractLink: editData.contract_link ?? "",
        performance: typeof editData.performance === 'object' && editData.performance !== null
          ? (editData.performance.performance ?? "")
          : (editData.performance ?? ""),
        feedback: editData.feedback ?? "",
        reelsRating: editData.deliverable_details?.reels?.rating ?? 0,
        storyRating: editData.deliverable_details?.story?.rating ?? 0,
        adRights: editData.deliverable_details?.ad_rights ?? "no",
        performanceDropdown: editData.performance?.dropdown ?? "",
        performanceCheckbox: editData.performance?.checkbox ?? false,
        performanceCheckboxViews: typeof editData.performance === 'object' && editData.performance !== null
          ? !!editData.performance.performanceCheckboxViews
          : !!editData.performanceCheckboxViews,
        performanceCheckboxComments: typeof editData.performance === 'object' && editData.performance !== null
          ? !!editData.performance.performanceCheckboxComments
          : !!editData.performanceCheckboxComments,
      comments: typeof editData.performance === 'object' && editData.performance !== null
        ? (editData.performance.comments ?? editData.comments ?? "") // Get the string value, fallback to editData.comments, then to ""
        : (editData.comments ?? ""),                               // Get the string value directly from editData, fallback to ""
        brad: editData.brad ?? "", // Ensure brad is set from editData
      });
      setProductLinks(
        editData.product_details && Array.isArray(editData.product_details) && editData.product_details.length > 0
          ? [editData.product_details]
          : [[""]]
      );
      // Set barterItems directly when editing and payment type is Barter
      if (editData.colab_type === "Barter" && editData.payment_json && Array.isArray(editData.payment_json.barter)) {
        setBarterItems(editData.payment_json.barter.length > 0 ? editData.payment_json.barter : [""]);
      } else {
        setBarterItems([""]);
      }
    } else {
      setFormData({
        influencer: "",
        status: "",
        workflowStatus: "",
        postDueDate: "",
        colab: "",
        productStatus: "",
        deliverable: "",
        concept: "",
        amount: "",
        markPaid: false,
        returnReceived: false,
        returnDate: "",
        size: "",
        contractLink: "",
        performance: "",
        feedback: "",
        reelsRating: 0,
        storyRating: 0,
        adRights: "no",
        performanceDropdown: "",
        performanceCheckbox: false,
      });
      setProductLinks([[""]]);
      setBarterItems([""]);
    }
    setErrorMsg("");
    setLoading(false);
    setChangesRequiredComment(""); // Reset comment when modal opens/closes
    setShowChangesRequiredComment(false); // Reset comment section visibility
  }, [isOpen, editData]);

  // Removed secondary barterItems sync effect; handled in main useEffect above

  // Product links handlers
  const handleProductLinkChange = (rowIdx: number, colIdx: number, value: string) => {
    setProductLinks(prev => {
      const updated = [...prev];
      updated[rowIdx] = [...updated[rowIdx]];
      updated[rowIdx][colIdx] = value;
      return updated;
    });
  };

  const addProductLinkNext = (rowIdx: number, colIdx: number) => {
    setProductLinks(prev => {
      const updated = [...prev];
      updated[rowIdx] = [...updated[rowIdx], ""];
      return updated;
    });
  };

  const addProductLinkRow = (rowIdx: number) => {
    setProductLinks(prev => {
      const updated = [...prev];
      updated.splice(rowIdx + 1, 0, [""]);
      return updated;
    });
  };

  const removeProductLink = (rowIdx: number, colIdx: number) => {
    setProductLinks(prev => {
      const updated = [...prev];
      updated[rowIdx] = updated[rowIdx].filter((_, c) => c !== colIdx);
      // Ensure there's always at least one empty input field
      if (updated.every(row => row.length === 0)) {
        return [[""]]; // Reset to one empty field if all are removed
      }
      return updated.filter(row => row.length > 0); // Remove empty rows
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = async (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        if (editData && editData.s_no) {
          // Edit mode: auto-update and close
          handleSubmit();
        } else {
          // Create mode:
          const requiredFields = [
            formData.influencer,
            formData.status,
            formData.colab,
            formData.productStatus,
            formData.deliverable,
            formData.concept
          ];
          const allEmpty = requiredFields.every(val => !val.trim());
          if (allEmpty) {
            // All fields empty, just close
            onClose();
            return;
          }
          // If all required fields are filled, insert the user
          const allFilled = requiredFields.every(val => val && val.trim());
          if (allFilled) {
            await handleSubmit();
            return;
          }
          // If any field has data, show errors for empty fields and do not close
          // Validation check commented out
          // if (!validateFields()) {
          //   setErrorMsg("Please fill all required fields before closing.");
          //   return;
          // } else {
          //   // All fields valid, close
          //   onClose();
          // }
          onClose();
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, editData, formData]);

  const handleInputChange = (field: keyof FormData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field as keyof FieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleBarterItemChange = (index: number, value: string) => {
    setBarterItems(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const addBarterItem = () => {
    setBarterItems(prev => [...prev, ""]);
  };

  const removeBarterItem = (index: number) => {
    setBarterItems(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.length > 0 ? updated : [""];
    });
  };

  const validateFields = (): boolean => {
  // Validation logic implemented for required fields
  const errors: Partial<FieldErrors> = {};
  if (!formData.influencer.trim()) errors.influencer = "Influencer is required";
  if (!formData.status.trim()) errors.status = "Status is required";
  if (!formData.colab.trim()) errors.colab = "Payment Type is required";
  if (!formData.brad?.trim()) errors.brad = "Brand is required"; // Add brand validation
  // Add other validations if needed
  setFieldErrors(errors as FieldErrors);
  return Object.keys(errors).length === 0;
  };

  // Import updateInfluencer
  // @ts-ignore
  // eslint-disable-next-line
  const { insertInfluencer, updateInfluencer } = require("@/lib/Influencer/Influencer.tsx");

  // Always set workflow_status to 'working' when creating a new influencer
  const handleSubmit = async (customWorkflowStatus?: string, commentForChanges?: string) => {
    setErrorMsg("");
    // Validate fields before submission
    if (!validateFields()) {
      return; // Stop if validation fails
    }
    setLoading(true);

    // Flatten productLinks to a single list, removing empty strings
    const productLinksList = productLinks.flat().map(link => link.trim()).filter(link => link.length > 0);

    // Prepare influencer_id as a number if selected
    let influencerIdNum: number | undefined = undefined;
    if (formData.influencer && !isNaN(Number(formData.influencer))) {
      influencerIdNum = Number(formData.influencer);
    }

    // Always prepare performance data, even if empty
    const performanceValue = {
      performance: formData.performance ?? "",
      performanceCheckboxViews: !!formData.performanceCheckboxViews,
      performanceCheckboxComments: !!formData.performanceCheckboxComments
    };

    // Always send comments, even if empty
    const commentsValue = commentForChanges || formData.comments || "";

    // Determine workflow_status: use custom status if provided (from specific buttons), else use current form value or default for create
const workflowStatusValue = customWorkflowStatus
  || (formData.workflowStatus && formData.workflowStatus.trim() ? formData.workflowStatus : undefined)
  || (editData ? undefined : "working");

    // Prepare payment_json based on colab type
    let payment_json;
    if (formData.colab === "Barter") {
      payment_json = {
        barter: barterItems.filter(item => typeof item === 'string' && item.trim() !== "")
      };
    } else {
      payment_json = {
        paid: !!formData.markPaid,
        amount: formData.amount && !isNaN(Number(formData.amount)) ? Number(formData.amount) : 0
      };
    }

    // Prepare payload - always include all fields with empty strings when needed
    const payload = {
      influencer_id: influencerIdNum,
      status: formData.status,
      workflow_status: workflowStatusValue,
      post_due_date: formData.postDueDate || null,
      colab_type: formData.colab,
      product_status: formData.productStatus,
      deliverable_details: {
        reels: {
          rating: Number(formData.reelsRating) || 0
        },
        story: {
          rating: Number(formData.storyRating) || 0
        },
        ad_rights: formData.adRights || "no"
      },
      concept: formData.concept || "",
      size: formData.size || "",
      contract_link: formData.contractLink || "",
      payment_json,
      return_received: {
        received: !!formData.returnReceived,
        date: formData.returnReceived ? formData.returnDate || null : null
      },
      product_details: productLinksList,
      feedback: formData.feedback || "",
      performance: performanceValue,
      comments: commentsValue,
      brad: formData.brad || "",
    };

    try {
      let result;
      if (editData && editData.s_no) {
        // Update - Include s_no and ensure all fields are sent
        const updatePayload = {
          ...payload,
          s_no: editData.s_no,
          // Force empty strings for null/undefined values
          concept: payload.concept ?? "",
          size: payload.size ?? "",
          contract_link: payload.contract_link ?? "",
          feedback: payload.feedback ?? "",
          comments: payload.comments ?? "",
          brad: payload.brad ?? "",
          performance: payload.performance || { performance: "", performanceCheckboxViews: false, comment: false },
          product_details: payload.product_details || []
        };
        result = await updateInfluencer(updatePayload);
      } else {
        // Create
        result = await insertInfluencer(payload);
      }
      setLoading(false);
      if (typeof onCreate === 'function') onCreate(result);
      onClose();
    } catch (err: any) {
      setLoading(false);
      console.error("API Error:", err);
      let errorMessage = editData ? "Failed to update influencer. Please try again." : "Failed to create influencer. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      setErrorMsg(errorMessage);
    }
  };  

  // Delete handler
  const handleDelete = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      if (editData && editData.s_no) {
        // Soft delete: set is_delete true, send required fields with proper formatting
        const deletePayload = {
          s_no: editData.s_no,
          is_delete: true,
          // Include required fields with proper formatting
          influencer_id: editData.influencer_id,
          status: editData.status || "",
          workflow_status: editData.workflow_status || "",
          post_due_date: editData.post_due_date || null,
          colab_type: editData.colab_type || "",
          product_status: editData.product_status || "",
          concept: editData.concept || "",
          size: editData.size || "",
          brad: editData.brad || "",
          contract_link: editData.contract_link || "",
          // Format nested objects properly
          payment_json: editData.payment_json || { amount: 0, paid: false },
          return_received: editData.return_received || { received: false, date: null },
          product_details: editData.product_details || [],
          deliverable_details: editData.deliverable_details || "",
          feedback: editData.feedback || "",
          performance: editData.performance || null,
          comments: editData.comments || ""
        };
        
        const result = await updateInfluencer(deletePayload);
        setLoading(false);
        if (typeof onCreate === 'function') onCreate(result);
        onClose();
      }
    } catch (err: any) {
      setLoading(false);
      let errorMessage = "Failed to delete influencer. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      setErrorMsg(errorMessage);
      console.error("Delete error details:", err);
    }
  };

 const handleSendForReview = () => {
  // pass the status directly to handleSubmit so we don't rely on async state update
  handleSubmit("in_review");
};

const handleApprove = () => {
  handleSubmit("approved");
};

const handleChangesRequired = () => {
  if (showChangesRequiredComment) {
    // Second click: submit the comment and update status
    handleSubmit("in_reedit", changesRequiredComment);
    setChangesRequiredComment(""); // Reset comment
    setShowChangesRequiredComment(false); // Hide comment section
  } else {
    // First click: show the comment section
    setShowChangesRequiredComment(true);
  }
};


  if (!isOpen) return null;

  // Determine if fields should be disabled based on current tab during edit mode
  const isReEditTab = currentTab === 'Re-Edit' && editData;
  const isReviewTab = isCreator && currentTab === 'In Review' && !!editData;
  const isApprovedTab = currentTab === 'Approved' && editData;
  // When a user has only 'creator' access and is viewing an Approved item,
  // most fields should be read-only except performance, feedback and checkboxes.
  const isCreatorApprovedRestrict = isCreator && currentTab === 'Approved' && !!editData;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-[100]">
      <div ref={modalRef} className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">{editData ? "Edit Influencer" : "Add New Influencer"}</h2>
            <SmartDropdown
              options={[ 
                { label: "beelittle", value: "beelittle" },
                { label: "zing", value: "zing" },
                { label: "prathiksham", value: "prathiksham" },
                { label: "adoreaboo", value: "adoreaboo" }
              ]}
             disabled={isReviewTab || isCreatorApprovedRestrict}

              value={formData.brad ? formData.brad : ""}
              onChange={(value) => {
                const selected = Array.isArray(value) ? value[0] : value;
                setFormData(prev => ({ ...prev, brad: selected }));
                if (fieldErrors.brad) setFieldErrors(prev => ({ ...prev, brad: "" }));
              }}
              placeholder="Select Brand"
              className={`w-[150px] ${fieldErrors.brad ? "border-red-500" : ""}`}
            />
            {fieldErrors.brad && <p className="text-red-500 text-xs mt-1">{fieldErrors.brad}</p>} {/* Show error */}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error message */}
        {/* {errorMsg && (
          <div className="px-6 py-2 bg-red-50 text-red-700 border-b border-red-200 text-sm">{errorMsg}</div>
        )} */}

        {/* Modal Content */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col"> {/* Make the main content area a flex container */}
          {/* Comment Section for Re-Edit Tab - Appears Above Inputs */}
          {isReEditTab && editData && editData.comments && (
            <div className="mb-6 px-4 py-3 bg-gray-100 rounded-lg border border-gray-200">
              <h3 className="text-[12px] font-medium text-gray-500 mb-2">Changes Required Comment:</h3>
              <p className="text-sm text-gray-700">{editData.comments}</p> {/* Display the comment from editData */}
            </div>
          )}

          {/* Main Input Fields Container */}
          <div className="flex-1"> {/* This allows the inputs to take remaining space */}
            {/* First Line: Influencer Dropdown + Disabled Input, Status, Colab Type */}
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div>
                <SmartDropdown
                  options={influencerOptions}
                  value={formData.influencer}
                  disabled={isReviewTab || isCreatorApprovedRestrict}
                  label="Influencer *"
                  onChange={(value) => handleInputChange("influencer", Array.isArray(value) ? value[0] : value)}
                  placeholder="Select Influencer"
                  className={`w-full ${fieldErrors.influencer ? "border-red-500" : ""}`}
                />
                {fieldErrors.influencer && <p className="text-red-500 text-xs mt-1">{fieldErrors.influencer}</p>}
              </div>
              <div>
                <SmartInputBox
                  value={formData.workflowStatus}
                  onChange={(value) => handleInputChange("workflowStatus", value)}
                  placeholder=""
                  label="Workflow Status"
                  className={`w-full`}
                  disabled={true}
                />
              </div>
              <div>
                <SmartDropdown
                  options={statusOptions}
                  disabled={isReviewTab || isCreatorApprovedRestrict}
                  value={formData.status}
                  label="Status *"
                  onChange={(value) => handleInputChange("status", Array.isArray(value) ? value[0] : value)}
                  placeholder="Select Status"
                  className={`w-full ${fieldErrors.status ? "border-red-500" : ""}`}
                />
                {fieldErrors.status && <p className="text-red-500 text-xs mt-1">{fieldErrors.status}</p>}
              </div>
              <div>
                <SmartDropdown
                  options={colabOptions}
                  value={formData.colab}
                  disabled={isReviewTab || isCreatorApprovedRestrict}
                  label="Payment Type *"
                  onChange={(value) => handleInputChange("colab", Array.isArray(value) ? value[0] : value)}
                  placeholder="Select Payment Type"
                  className={`w-full ${fieldErrors.colab ? "border-red-500" : ""}`}
                />
                {fieldErrors.colab && <p className="text-red-500 text-xs mt-1">{fieldErrors.colab}</p>}
              </div>
            </div>

            {/* Second Line: Product Status, Size, Contract Link, Date Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <SmartInputBox
                  value={formData.size}
                  disabled={isReviewTab || isCreatorApprovedRestrict}
                  onChange={(value) => handleInputChange("size", value)}
                  placeholder="Enter size"
                  label="Size"
                  className={`w-full ${fieldErrors.size ? "border-red-500" : ""}`}
                />
                {fieldErrors.size && <p className="text-red-500 text-xs mt-1">{fieldErrors.size}</p>}
              </div>
              <div>
                <SmartInputBox
                  value={formData.contractLink}
                  disabled={isReviewTab || isCreatorApprovedRestrict}
                  onChange={(value) => handleInputChange("contractLink", value)}
                  placeholder="Enter contract link"
                  label="Contract Link"
                  className={`w-full ${fieldErrors.contractLink ? "border-red-500" : ""}`}
                />
                {fieldErrors.contractLink && <p className="text-red-500 text-xs mt-1">{fieldErrors.contractLink}</p>}
              </div>
              <div>
                <SmartDropdown
                  options={productStatusOptions}
                  value={formData.productStatus}
                  disabled={isReviewTab || isCreatorApprovedRestrict}
                  label="Product Status *"
                  onChange={(value) => handleInputChange("productStatus", Array.isArray(value) ? value[0] : value)}
                  placeholder="Select Product Status"
                  className={fieldErrors.productStatus ? "border-red-500" : ""}
                />
                {fieldErrors.productStatus && <p className="text-red-500 text-xs mt-1">{fieldErrors.productStatus}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Post Due Date</label>
                <input
                  type="date"
                  disabled={isReviewTab || isCreatorApprovedRestrict}
                  value={formData.postDueDate}
                  onChange={(e) => handleInputChange("postDueDate", e.target.value)}
                  className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Product Links */}
            <div className="mb-6">
              <h3 className="text-[12px] font-medium text-gray-500 mb-1">Product Links</h3>
              <div className="space-y-4">
                {productLinks.map((row, rowIdx) => (
                  <div
                    key={rowIdx}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start bg-gray-50 p-4 rounded-lg border border-gray-200"
                  >
                    {row.map((link, colIdx) => (
                      <div key={colIdx} className="relative flex items-center w-full">
                        <SmartInputBox
                          value={link}
                          onChange={(value) => handleProductLinkChange(rowIdx, colIdx, value)}
                          placeholder={`Product link ${rowIdx * 2 + colIdx + 1}`}
                          label=""
                          className="w-full"
                          disabled={isReviewTab || isCreatorApprovedRestrict}
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
                          disabled={isReviewTab || isCreatorApprovedRestrict}
                        >
                          −
                        </button>
                        {/* Plus Button (only beside the last input of the last row) */}
                        {rowIdx === productLinks.length - 1 &&
                          colIdx === row.length - 1 && (
                            <button
                              type="button"
                              className={`ml-2 px-2 py-1 rounded text-xs transition-colors ${!link.trim() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                              onClick={() => addProductLinkNext(rowIdx, colIdx)}
                              disabled={!link.trim() || isReviewTab || isCreatorApprovedRestrict}
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


            {/* Deliverable Ratings & Concept Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Deliverable Ratings Section */}
              <div className="mb-6">
                {/* Title outside and above the card */}
                <h3 className="text-[12px] font-normal text-gray-500 mb-1">
                  Deliverable Ratings
                </h3>

                {/* Card container */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                    {/* Reels Rating */}
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-600 mb-2">Reels</label>
                      <SmartDropdown
                        label={""}                     // keep internal label empty
                        value={formData.reelsRating !== undefined && formData.reelsRating !== null ? String(formData.reelsRating) : ""}
                        onChange={(value) =>
                          handleInputChange("reelsRating", Array.isArray(value) ? value[0] : value)
                        }
                        options={Array.from({ length: 10 }, (_, i) => ({
                          label: `${i + 1}`,
                          value: `${i + 1}`,
                        }))}
                        disabled={isReviewTab || isCreatorApprovedRestrict}
                        placeholder="Select"
                        className="w-full text-sm h-10"
                      />
                    </div>

                    {/* Story Rating */}
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-600 mb-2">Story</label>
                      <SmartDropdown
                        label={""}
                        value={formData.storyRating !== undefined && formData.storyRating !== null ? String(formData.storyRating) : ""}
                        onChange={(value) =>
                          handleInputChange("storyRating", Array.isArray(value) ? value[0] : value)
                        }
                        options={Array.from({ length: 10 }, (_, i) => ({
                          label: `${i + 1}`,
                          value: `${i + 1}`,
                        }))}
                        disabled={isReviewTab || isCreatorApprovedRestrict}
                        placeholder="Select"
                        className="w-full text-sm h-10"
                      />
                    </div>

                    {/* Ad Rights */}
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-600 mb-2">Ad Rights</label>
                      <SmartDropdown
                        label={""}
                        value={formData.adRights ?? ""}
                        onChange={(value) =>
                          handleInputChange("adRights", Array.isArray(value) ? value[0] : value)
                        }
                        options={[
                          { label: "Yes", value: "Yes" },
                          { label: "No", value: "No" },
                        ]}
                        disabled={isReviewTab || isCreatorApprovedRestrict}
                        placeholder="Select"
                        className="w-full text-sm h-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Concept Box (right side) */}
              <div>
                <SmartInputBox
                  value={formData.concept}
                  onChange={(value) => handleInputChange("concept", value)}
                  placeholder="Enter concept"
                  label="Concept *"
                  rows={4}
                  maxHeight={100}
                  disabled={isReviewTab || isCreatorApprovedRestrict}
                  className={`w-full ${fieldErrors.concept ? "border-red-500" : ""}`}
                  overflowBehavior="scroll"
                  autoExpand={false}
                />
                {fieldErrors.concept && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.concept}</p>
                )}
              </div>

            </div>


            {/* Amount & Return Date in same row, checkboxes above, with status icon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              {/* Amount / Barter Section */}
              <div className="bg-white shadow-sm rounded-xl px-3 py-5 border border-gray-200 h-30 overflow-hidden flex flex-col">
                {formData.colab === "Barter" ? (
                  <>
                    <span className="block text-[12px] text-gray-500 font-medium mb-1">
                      Barter Item Details
                    </span>
                    {/* Scrollable area with max height */}
                    <div style={{ maxHeight: '85px', overflowY: 'auto' }} className="pr-1 space-y-2 scrollbar-thin scrollbar-thumb-gray-300">
                      {barterItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <SmartInputBox
                            value={item}
                            onChange={(value) => handleBarterItemChange(idx, value)}
                            placeholder={`Barter item ${idx + 1}`}
                            label=""
                            className="w-full"
                            disabled={isReviewTab || isCreatorApprovedRestrict}
                          />
                          {/* External Link SVG Icon */}
                          <button
                            type="button"
                            className="ml-2 px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs hover:bg-blue-100"
                            style={{ display: 'flex', alignItems: 'center' }}
                            onClick={() => {
                              if (typeof item === 'string' && item.trim()) {
                                const url = item.match(/^https?:\/\//) ? item : `https://${item}`;
                                window.open(url, "_blank");
                              }
                            }}
                            tabIndex={-1}
                            aria-label="Open link"
                            disabled={typeof item !== 'string' || !item.trim()}
                          >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 20, height: 20 }}>
                              <path d="M7.5 3.75H4.16667C3.24619 3.75 2.5 4.49619 2.5 5.41667V15.4167C2.5 16.3371 3.24619 17.0833 4.16667 17.0833H14.1667C15.0871 17.0833 15.8333 16.3371 15.8333 15.4167V12.0833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M13.3333 2.5H17.5V6.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M8.33333 11.6667L17.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          {/* Remove Button */}
                          <button
                            type="button"
                            disabled={isReviewTab || isCreatorApprovedRestrict}
                            className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs hover:bg-red-200 transition-colors"
                            onClick={() => removeBarterItem(idx)}
                          >
                            −
                          </button>
                          {/* Plus Button (only beside the last input of the last row) */}
                          {idx === barterItems.length - 1 && (
                            <button
                              type="button"
                              className={`ml-2 px-2 py-1 rounded text-xs transition-colors ${typeof item !== 'string' || !item.trim() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                              onClick={() => addBarterItem()}
                              disabled={typeof item !== 'string' || !item.trim() || isReviewTab || isCreatorApprovedRestrict}
                            >
                              +
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <span className="block text-[12px] text-gray-500">Paid Status</span>
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-medium border transition-all ${
                          formData.markPaid
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}
                      >
                        {formData.markPaid ? "Paid" : "Unpaid"}
                        <input
                          type="checkbox"
                          disabled={isReviewTab || isCreatorApprovedRestrict}
                          checked={formData.markPaid}
                          onChange={(e) => handleInputChange("markPaid", e.target.checked)}
                          className="w-4 h-4 accent-blue-600 ml-2"
                        />
                      </span>
                    </div>

                    <div className="mt-auto">
                      <span className="block text-[12px] text-gray-500">Amount</span>
                      <SmartInputBox
                        value={formData.amount}
                        onChange={(value) => handleInputChange("amount", value)}
                        placeholder="Enter amount"
                        label=""
                        className="w-full"
                        disabled={isReviewTab || isCreatorApprovedRestrict}
                      />
                    </div>
                  </>
                )}
              </div>



              {/* Return Date & Received */}
              <div className="bg-white rounded-xl py-5 px-3 border border-gray-200">
                <div className="flex items-center mb-4">
                  <span className="block text-[12px] text-gray-500 mr-auto">Received Status</span>
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-normal border ${formData.returnReceived ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} ml-2`}
                  >
                    {formData.returnReceived ? 'Received' : 'Not Received'}
                    <input
                      type="checkbox"
                      disabled={isReviewTab || isCreatorApprovedRestrict}
                      checked={formData.returnReceived}
                      onChange={(e) => handleInputChange("returnReceived", e.target.checked)}
                      className="w-4 h-4 accent-blue-600 ml-2"
                    />
                  </span>
                </div>
                <div>
                  <span className="block text-[12px] text-gray-500 mt-2">Return Date</span>
                  <input
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => handleInputChange("returnDate", e.target.value)}
                    disabled={!formData.returnReceived || isReviewTab || isCreatorApprovedRestrict} // Disable in Re-Edit or if not received or creator+approved
                    className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !formData.returnReceived
                        ? "bg-gray-100 cursor-not-allowed text-gray-400"
                        : "bg-white"
                    }`}
                  />
                </div>
              </div>
            </div>


            {/* Performance Section */}
            {editData && currentTab === 'Approved' && (
              <div className="bg-white rounded-xl mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left side — Fields */}
                  <div className="flex flex-col px-1">
                    {/* Dropdown with label */}
                    <SmartDropdown
                      label="Performance"
                      value={formData.performance || ""}
                      onChange={(value) =>
                        handleInputChange("performance", Array.isArray(value) ? value[0] : value)
                      }
                      disabled={isReviewTab}
                      options={[
                        { label: "Good", value: "Good" },
                        { label: "Bad", value: "Bad" },
                      ]}
                      placeholder="Select performance"
                      className="w-full text-sm h-9"
                    />

                    {/* Checkbox grid */}
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm px-1 py-4">
                      <label className="flex items-center gap-2 text-gray-700">
                        <input
                          type="checkbox"
                          disabled={isReviewTab || formData.performance == ""}
                          checked={!!formData.performanceCheckboxViews}
                          onChange={(e) => handleInputChange("performanceCheckboxViews", e.target.checked)}
                          className="w-4 h-4 accent-blue-600"
                          aria-label="Views"
                        />
                        <span>Views</span>
                      </label>

                      <label className="flex items-center gap-2 text-gray-700">
                        <input
                          type="checkbox"
                          disabled={isReviewTab || formData.performance == ""}
                          checked={!!formData.performanceCheckboxComments}
                          onChange={(e) => handleInputChange("performanceCheckboxComments", e.target.checked)}
                          className="w-4 h-4 accent-blue-600"
                          aria-label="Comments"
                        />
                        <span>Comments</span>
                      </label>
                    </div>
                  </div>

                  {/* Right side — Feedback box */}
                  <div className="flex flex-col">
                    <SmartInputBox
                      value={formData.feedback || ""}
                      onChange={(value) => handleInputChange("feedback", value)}
                      placeholder="Write feedback about influencer’s performance..."
                      label="Feedback"
                      rows={5}
                      disabled={isReviewTab}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div> {/* End of Main Input Fields Container */}
        </div> {/* End of Modal Content */}

        {/* Modal Footer */}
        <div className="flex flex-col"> {/* Wrap footer content in a flex column */}
          {/* Top Footer Section: Delete, Cancel, etc. */}
          <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50">
            {/* Left: Delete button in edit mode, permission-based */}
            <div>
              {editData && editData.s_no && (
                ((isCreator && (currentTab === 'Working' || currentTab === 'Re-Edit')) || !isCreator) && (
                  <>
                    <Button
                      onClick={() => setShowDeleteConfirm(true)}
                      variant="danger"
                      size="m"
                      disabled={loading}
                    >
                      {loading ? "Deleting..." : "Delete"}
                    </Button>
                    <InfoPermissionModal
                      open={showDeleteConfirm}
                      type="confirm"
                      message={"Are you sure you want to delete this influencer? This action cannot be undone."}
                      onClose={() => setShowDeleteConfirm(false)}
                      onConfirm={handleDelete}
                    />
                  </>
                )
              )}
            </div>
            {/* Right: Buttons based on permission and tab */}
            <div className="flex gap-3">
              {/* Always show Cancel */}
              <Button onClick={onClose} variant="outline" size="m">Cancel</Button>

              {/* Permission-based buttons for creator in Working or Re-Edit */}
              {isCreator && (currentTab === 'Working' || currentTab === 'Re-Edit') && (
                <>
                  {/* Always show Send for Review for creators in Working or Re-Edit tab (mandatory) */}
                  <Button onClick={handleSendForReview} variant="blue" size="m" disabled={loading}>
                    {loading ? "Sending..." : "Send for Review"}
                  </Button>
                  {/* Show Update button during update in Working or Re-Edit tab */}
                  {editData && (
                    <Button onClick={() => handleSubmit()} variant="primary" size="m" disabled={loading}>
                      {loading ? "Updating..." : "Update"}
                    </Button>
                  )}
                  {/* Show Create button only when not editing */}
                  {!editData && (
                    <Button onClick={() => handleSubmit()} variant="primary" size="m" disabled={loading}>
                      {loading ? "Creating..." : "Create"}
                    </Button>
                  )}
                </>
              )}

              {/* If not creator, show all buttons as before */}
              {!isCreator && (
                <>
                  {/* Show Send for Review only during Create or if currentTab is Working */}
                  {(currentTab === 'Working' || !editData) && (
                    <Button onClick={handleSendForReview} variant="blue" size="m" disabled={loading}>
                      {loading ? "Sending..." : "Send for Review"}
                    </Button>
                  )}

                  {/* Show Approve and Changes Required only during Update and if currentTab is In Review */}
                  {editData && currentTab === 'In Review' && (
                    <>
                      <Button onClick={handleApprove} variant="primary" size="m" disabled={loading}>
                        {loading ? "Approving..." : "Approve"}
                      </Button>
                      <Button onClick={handleChangesRequired} variant="blue" size="m" disabled={loading}>
                        {loading ? "Processing..." : "Changes Required"}
                      </Button>
                    </>
                  )}

                  {/* Show Send for Review only during Update and if currentTab is Re-Edit */}
                  {editData && currentTab === 'Re-Edit' && (
                    <>
                      <Button onClick={handleSendForReview} variant="blue" size="m" disabled={loading}>
                        {loading ? "Sending..." : "Send for Review"}
                      </Button>
                      <Button onClick={() => handleSubmit()} variant="primary" size="m" disabled={loading}>
                        {loading ? "Updating..." : "Update"}
                      </Button>
                    </>
                  )}

                  {/* Main Create/Update Button */}
                  {/* Show Update button only for Approved tab when editing, otherwise show Create */}
                  {editData && currentTab === 'Approved' ? (
                    <Button onClick={() => handleSubmit()} variant="primary" size="m" disabled={loading}>
                      {loading ? "Updating..." : "Update"}
                    </Button>
                  ) : !editData ? ( // Show Create button only when not editing
                    <Button onClick={() => handleSubmit()} variant="primary" size="m" disabled={loading}>
                      {loading ? "Creating..." : "Create"}
                    </Button>
                  ) : null}

                  {editData && currentTab !== 'Approved' && currentTab !== 'In Review' && currentTab !== 'Re-Edit' && (
                    <Button onClick={() => handleSubmit()} variant="primary" size="m" disabled={loading}>
                      {loading ? "Updating..." : "Update"}
                    </Button>
                  )}
                </>
              )}
              {isCreator && (
                    <Button onClick={() => handleSubmit()} variant="primary" size="m" disabled={loading}>
                      {loading ? "Updating..." : "Update"}
                    </Button>
                  )}
            </div>
          </div>
          
          {/* Conditional Comment Section for Changes Required (appears in footer during In Review) */}
          {currentTab === 'In Review' && editData && showChangesRequiredComment && (
            <div className="px-6 py-3 border-t bg-gray-100">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Add Comment for Changes:</label>
                <SmartInputBox
                  value={changesRequiredComment}
                  onChange={(value) => setChangesRequiredComment(value)}
                  placeholder="Enter reason for changes required..."
                  rows={3}
                  className="w-full"
                />
                <div className="flex justify-end mt-2">
                  <Button onClick={() => setShowChangesRequiredComment(false)} variant="outline" size="m">Cancel</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}