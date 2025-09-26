import { useUser } from "@/hooks/usercontext";

export const getDropdownColumns = () => {
  const { user } = useUser(); // Extract dropdowns from useUser

  // Safeguard to ensure user and dropdowns are defined
  if (!user || !user.dropdowns) {
    console.warn("User or dropdowns data is not available yet.");
    return []; // Return an empty array if dropdowns are not available
  }

  // Dynamically generate dropdown columns
  const dropdownColumns = Object.keys(user.dropdowns).map((key) => ({
    id: key,
    label: key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()), // Convert key to a readable label
    accessor: key,
    options: user.dropdowns?.[key], // Use the options from the dropdowns object
  }));

  return dropdownColumns;
};