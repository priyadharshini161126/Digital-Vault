import { useNavigate } from "react-router-dom";
function Navbar() {
     const navigate = useNavigate();
  return (
    <nav className="w-full flex justify-between items-center px-10 py-6">

      <h1 className="text-xl font-semibold tracking-wide">
        DIGITAL VAULT
      </h1>

      <div className="flex gap-8 items-center text-gray-400">

        <span className="hover:text-white cursor-pointer transition">
          Features
        </span>

        <span className="hover:text-white cursor-pointer transition">
          About
        </span>

        <button
        onClick={() => navigate("/dashboard")}
        className="
        px-5 py-2 
        bg-white 
        text-black 
        rounded-full
        hover:scale-105
        transition
        ">
          Enter Vault
        </button>

      </div>

    </nav>
  )
}

export default Navbar