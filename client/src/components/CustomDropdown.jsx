import { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";

function CustomDropdown({
  options,
  value,
  onChange,
  width = "180px",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () =>
      document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div
      className="custom-dropdown"
      style={{ width }}
      ref={ref}
    >
      <button
        className={`dropdown-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen(!open)}
      >
        <span>{value}</span>

        <FaChevronDown />
      </button>

      {open && (
        <div className="dropdown-menu">
          {options.map((option) => (
            <button
              key={option}
              className={`dropdown-item ${
                value === option ? "active" : ""
              }`}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomDropdown;