import { useEffect, useMemo, useState } from "react";
import API from "./api/axios";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  CheckCircle2,
  Download,
  FileText,
  FolderLock,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Trash2,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";

const formatSize = (bytes = 0) => {
  if (!bytes) return "0 KB";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const getInitials = (email) => {
  if (!email) return "DV";

  return email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const getViewFromPath = () => {
  const path = window.location.pathname.replace("/", "");

  if (path === "documents") return "documents";
  if (path === "uploads" || path === "upload") return "upload";
  if (path === "profile") return "profile";

  return "overview";
};

const getAuthModeFromPath = () => (
  window.location.pathname === "/signup" ? "signup" : "signin"
);


const loginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const signupSchema = Yup.object().shape({
  firstName: Yup.string().required("First name is required"),
  secondName: Yup.string().required("Second name is required"),
  phone: Yup.string().required("Phone number is required"),
  gender: Yup.string().oneOf(["male", "female", "others"]).required("Gender is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const dashboardTabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "documents", label: "Documents", icon: FolderLock },
  { id: "upload", label: "Upload", icon: UploadCloud },
  { id: "profile", label: "Profile", icon: UserRound },
];

function App() {
  const [email, setEmail] = useState("priya@gmail.com");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [activeView, setActiveView] = useState(getViewFromPath);
  const [authMode, setAuthMode] = useState(getAuthModeFromPath);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState("email");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [profile, setProfile] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [uploadSnackOpen, setUploadSnackOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    secondName: "",
    phone: "",
    gender: "",
    email: "",
  });


  const authFormik = useFormik({
    initialValues: {
      firstName: "",
      secondName: "",
      phone: "",
      gender: "",
      email: email || "priya@gmail.com",
      password: password || "123456",
    },
    enableReinitialize: true,
    validationSchema: authMode === "signin" ? loginSchema : signupSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: (values) => {
      if (authMode === "signin") {
        handleLoginSubmit(values);
      } else {
        handleSignupSubmit(values);
      }
    },
  });

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return files;

    return files.filter((file) =>
      file.originalName?.toLowerCase().includes(query)
    );
  }, [files, search]);

  const totalStorage = useMemo(
    () => files.reduce((total, file) => total + (file.size || 0), 0),
    [files]
  );

  const loadFiles = async () => {
    if (!token) return;

    try {
      const response = await API.get("/files", {
        headers: authHeaders,
      });

      setFiles(response.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load your documents.");
    }
  };

  const navigateToView = (view) => {
    const pathByView = {
      overview: "/overview",
      documents: "/documents",
      upload: "/uploads",
      profile: "/profile",
    };

    setActiveView(view);
    window.history.pushState({}, "", pathByView[view]);
  };

  const navigateToAuth = (mode) => {
    setAuthMode(mode);
    setMessage("");
    window.history.pushState({}, "", mode === "signup" ? "/signup" : "/login");
  };

  useEffect(() => {
    const handlePopState = () => {
      if (localStorage.getItem("token")) {
        setActiveView(getViewFromPath());
      } else {
        setAuthMode(getAuthModeFromPath());
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!token) return;

      try {
        const response = await API.get("/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const user = response.data.user;

        if (isMounted) {
          setProfile(user);
          setProfileForm({
            firstName: user.firstName || "",
            secondName: user.secondName || "",
            phone: user.phone || "",
            gender: user.gender || "",
            email: user.email || "",
          });
          setEmail(user.email || "");
        }
      } catch (error) {
        if (isMounted) {
          setMessage(error.response?.data?.message || "Could not load your profile.");
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialFiles = async () => {
      if (!token) return;

      try {
        const response = await API.get("/files", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (isMounted) {
          setFiles(response.data);
        }
      } catch (error) {
        if (isMounted) {
          setMessage(error.response?.data?.message || "Could not load your documents.");
        }
      }
    };

    loadInitialFiles();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleLoginSubmit = async (values) => {
    setIsBusy(true);
    setMessage("");

    try {
      const response = await API.post("/auth/login", {
        email: values.email,
        password: values.password,
      });
      setEmail(values.email);
      setPassword(values.password);

      localStorage.setItem("token", response.data.token);
      setToken(response.data.token);
      setMessage("Welcome back. Your vault is ready.");
      navigateToView("overview");
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed. Check your email and password.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleSignupSubmit = async (values) => {
    setIsBusy(true);
    setMessage("");

    try {
      await API.post("/auth/register", {
        firstName: values.firstName,
        secondName: values.secondName,
        phone: values.phone,
        gender: values.gender,
        email: values.email,
        password: values.password,
      });
      setEmail(values.email);
      setPassword(values.password);

      const response = await API.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      setToken(response.data.token);
      setMessage("Your vault has been created.");
      navigateToView("overview");
    } catch (error) {
      setMessage(error.response?.data?.message || "Sign up failed. Try another email.");
    } finally {
      setIsBusy(false);
    }
  };

  const openResetModal = () => {
    setResetEmail(email);
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
    setResetStep("email");
    setResetMessage("");
    setResetOpen(true);
  };

  const handleSendResetCode = async (event) => {
    event.preventDefault();
    setIsBusy(true);
    setResetMessage("");

    try {
      const response = await API.post("/auth/forgot-password", {
        email: resetEmail,
      });

      setResetMessage(response.data.message);
      setResetStep("code");
    } catch (error) {
      setResetMessage(error.response?.data?.message || "Could not send verification code.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleVerifyResetCode = async (event) => {
    event.preventDefault();
    setIsBusy(true);
    setResetMessage("");

    try {
      const response = await API.post("/auth/verify-reset-code", {
        email: resetEmail,
        code: resetCode,
      });

      setResetMessage(response.data.message);
      setResetStep("password");
    } catch (error) {
      setResetMessage(error.response?.data?.message || "Verification failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setIsBusy(true);
    setResetMessage("");

    try {
      const response = await API.post("/auth/reset-password", {
        email: resetEmail,
        password: newPassword,
        confirmPassword,
      });

      localStorage.setItem("token", response.data.token);
      setEmail(resetEmail);
      setToken(response.data.token);
      setResetOpen(false);
      setResetMessage("");
      setMessage("Password changed successfully. You are logged in.");
      navigateToView("overview");
    } catch (error) {
      setResetMessage(error.response?.data?.message || "Password reset failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setFiles([]);
    setSelectedFile(null);
    setMessage("");
    setUploadSnackOpen(false);
    setActiveView("overview");
    navigateToAuth("signin");
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setMessage("Choose a document before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsBusy(true);
    setMessage("");

    try {
      await API.post("/upload", formData, {
        headers: authHeaders,
      });

      setSelectedFile(null);
      event.target.reset();
      await loadFiles();
      setMessage("");
      setUploadSnackOpen(true);
    } catch (error) {
      setMessage(error.response?.data?.message || "Upload failed. Try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleViewUploadedFiles = () => {
    setUploadSnackOpen(false);
    navigateToView("documents");
  };

  const handleDownload = (fileId) => {
    window.open(`${API.defaults.baseURL}/files/${fileId}?token=${token}`, "_blank");
  };

  const handleDelete = async (fileId) => {
    const shouldDelete = window.confirm("Delete this document from your vault?");

    if (!shouldDelete) return;

    setIsBusy(true);
    setMessage("");

    try {
      await API.delete(`/files/${fileId}`, {
        headers: authHeaders,
      });

      setMessage("Document deleted successfully.");
      await loadFiles();
    } catch (error) {
      setMessage(error.response?.data?.message || "Delete failed. Try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfileForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setIsBusy(true);
    setMessage("");

    try {
      const response = await API.put("/auth/profile", profileForm, {
        headers: authHeaders,
      });

      setProfile(response.data.user);
      setProfileForm({
        firstName: response.data.user.firstName || "",
        secondName: response.data.user.secondName || "",
        phone: response.data.user.phone || "",
        gender: response.data.user.gender || "",
        email: response.data.user.email || "",
      });
      setMessage("Profile updated successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update profile.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleProfileImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image exceeds the 5MB size limit.");
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setMessage("Please upload a valid JPG, JPEG, PNG, or WEBP image.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setIsBusy(true);
    setMessage("");

    try {
      const response = await API.post("/auth/profile/image", formData, {
        headers: {
          ...authHeaders,
          "Content-Type": "multipart/form-data"
        },
      });

      setProfile(response.data.user);
      setMessage("Profile image updated successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update profile image.");
    } finally {
      setIsBusy(false);
    }
  };

  if (!token) {
    return (
      <main className="login-shell">
        <section className="login-visual" aria-label="Digital Vault preview">
          <div className="brand-mark">DV</div>
          <div>
            <p className="eyebrow">Private document vault</p>
            <p className="login-title">
              Digital Vault
            </p>
            <p className="login-copy">
              Keep certificates, letters, records, and important memories in one calm,
              searchable workspace.
            </p>
          </div>
          <div className="trust-strip">
            <span>Encrypted access</span>
            <span>Personal files</span>
            <span>Fast retrieval</span>
          </div>
        </section>

        <section className="login-panel" aria-label="Login form">
          <div className="auth-form">
            <div className="auth-toggle" aria-label="Authentication mode">
              <button
                className={authMode === "signin" ? "active" : ""}
                onClick={() => navigateToAuth("signin")}
                type="button"
              >
                Sign in
              </button>
              <button
                className={authMode === "signup" ? "active" : ""}
                onClick={() => navigateToAuth("signup")}
                type="button"
              >
                Sign up
              </button>
            </div>

            <p className="eyebrow">{authMode === "signin" ? "Welcome back" : "Create account"}</p>
            <h2>{authMode === "signin" ? "Sign in to continue" : "Start your vault"}</h2>
            <p className="form-note">
              {authMode === "signin"
                ? "Use your registered Digital Vault account to open the dashboard."
                : "Register once, then upload and manage your personal documents."}
            </p>

            <form onSubmit={authFormik.handleSubmit}>
              {authMode === "signup" && (
                <>
                  <div className="form-grid">
                    <label>
                      First name
                      <input
                        type="text"
                        name="firstName" value={authFormik.values.firstName} onChange={authFormik.handleChange} onBlur={authFormik.handleBlur} placeholder="First name" autoComplete="given-name" style={authFormik.touched.firstName && authFormik.errors.firstName ? { borderColor: "red" } : {}}
                      />
                      {authFormik.touched.firstName && authFormik.errors.firstName && (
                        <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{authFormik.errors.firstName}</div>
                      )}
                    </label>

                    <label>
                      Second name
                      <input
                        type="text"
                        name="secondName" value={authFormik.values.secondName} onChange={authFormik.handleChange} onBlur={authFormik.handleBlur} placeholder="Second name" autoComplete="family-name" style={authFormik.touched.secondName && authFormik.errors.secondName ? { borderColor: "red" } : {}}
                      />
                      {authFormik.touched.secondName && authFormik.errors.secondName && (
                        <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{authFormik.errors.secondName}</div>
                      )}
                    </label>
                  </div>

                  <label>
                    Phone number
                    <input
                      type="tel"
                      name="phone" value={authFormik.values.phone} onChange={(e) => authFormik.setFieldValue("phone", e.target.value.replace(/\D/g, ""))} onBlur={authFormik.handleBlur} placeholder="Phone number" autoComplete="tel" style={authFormik.touched.phone && authFormik.errors.phone ? { borderColor: "red" } : {}}
                    />
                    {authFormik.touched.phone && authFormik.errors.phone && (
                      <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{authFormik.errors.phone}</div>
                    )}
                  </label>

                  <fieldset className="gender-field" style={authFormik.touched.gender && authFormik.errors.gender ? { border: "1px solid red", borderRadius: "8px", padding: "8px" } : {}}>
                    <legend>Gender</legend>
                    {["male", "female", "others"].map((option) => (
                      <button
                        className={authFormik.values.gender === option ? "active" : ""}
                        key={option}
                        onClick={() => { authFormik.setFieldValue("gender", option); authFormik.setFieldTouched("gender", true, false); }}
                        type="button"
                      >
                        {option[0].toUpperCase() + option.slice(1)}
                      </button>
                    ))}
                  </fieldset>
                  {authFormik.touched.gender && authFormik.errors.gender && (
                    <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{authFormik.errors.gender}</div>
                  )}
                </>
              )}

              <label>
                Email address
                <input
                  type="email"
                  name="email" value={authFormik.values.email} onChange={authFormik.handleChange} onBlur={authFormik.handleBlur} placeholder="name@example.com" autoComplete="email" style={authFormik.touched.email && authFormik.errors.email ? { borderColor: "red" } : {}}
                />
                {authFormik.touched.email && authFormik.errors.email && (
                  <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{authFormik.errors.email}</div>
                )}
              </label>

              <label>
                Password
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password" value={authFormik.values.password} onChange={authFormik.handleChange} onBlur={authFormik.handleBlur} placeholder="Enter your password" autoComplete={authMode === "signin" ? "current-password" : "new-password"} style={{ ...(authFormik.touched.password && authFormik.errors.password ? { borderColor: "red" } : {}), paddingRight: "40px", width: "100%", boxSizing: "border-box" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#6b7280"
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                {authFormik.touched.password && authFormik.errors.password && (
                  <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{authFormik.errors.password}</div>
                )}
              </label>

              {authMode === "signin" && (
                <button className="text-button" onClick={openResetModal} type="button">
                  Forgot password?
                </button>
              )}

              {message && <p className="status-message">{message}</p>}

              <button className="primary-button" disabled={isBusy} type="submit">
                {isBusy
                  ? authMode === "signin" ? "Signing in..." : "Creating vault..."
                  : authMode === "signin" ? "Login" : "Create account"}
              </button>
            </form>
          </div>
        </section>

        {resetOpen && (
          <section className="modal-backdrop" aria-label="Password reset">
            <div className="reset-modal">
              <button className="modal-close" onClick={() => setResetOpen(false)} type="button">
                Close
              </button>

              <p className="eyebrow">Account recovery</p>
              <h2>Reset your password</h2>
              <p className="form-note">
                {resetStep === "email" && "Enter your registered email. We will send a 6-digit verification code."}
                {resetStep === "code" && "A verification code has been sent. Enter the 6-digit number to continue."}
                {resetStep === "password" && "Create a new password for your Digital Vault account."}
              </p>

              {resetStep === "email" && (
                <form className="reset-form" onSubmit={handleSendResetCode}>
                  <label>
                    Email address
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(event) => setResetEmail(event.target.value)}
                      placeholder="name@example.com"
                      required
                    />
                  </label>
                  <button className="primary-button" disabled={isBusy} type="submit">
                    {isBusy ? "Sending code..." : "Send verification code"}
                  </button>
                </form>
              )}

              {resetStep === "code" && (
                <form className="reset-form" onSubmit={handleVerifyResetCode}>
                  <label>
                    Verification code
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(event) => setResetCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6-digit code"
                      inputMode="numeric"
                      maxLength="6"
                      required
                    />
                  </label>
                  <button className="primary-button" disabled={isBusy || resetCode.length !== 6} type="submit">
                    {isBusy ? "Verifying..." : "Verify code"}
                  </button>
                </form>
              )}

              {resetStep === "password" && (
                <form className="reset-form" onSubmit={handleResetPassword}>
                  <label>
                    New password
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="New password"
                      autoComplete="new-password"
                      required
                    />
                  </label>
                  <label>
                    Re-enter new password
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Confirm password"
                      autoComplete="new-password"
                      required
                    />
                  </label>
                  <button className="primary-button" disabled={isBusy} type="submit">
                    {isBusy ? "Changing password..." : "Confirm new password"}
                  </button>
                </form>
              )}

              {resetMessage && <p className="status-message">{resetMessage}</p>}
            </div>
          </section>
        )}
      </main>
    );
  }

  return (
    <main className={`dashboard-shell ${sidebarCollapsed ? "sidebar-pushed" : ""}`}>
      <aside className={`sidebar ${sidebarCollapsed ? "pushed" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark compact">DV</div>
          <div className="brand-copy">
            <strong>Digital Vault</strong>
            <span>Secure workspace</span>
          </div>
        </div>

        <button
          className="sidebar-toggle"
          onClick={() => setSidebarCollapsed((current) => !current)}
          type="button"
          aria-label={sidebarCollapsed ? "Push sidebar front" : "Push sidebar back"}
          title={sidebarCollapsed ? "Push front" : "Push back"}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          <span>{sidebarCollapsed ? "Push front" : "Push back"}</span>
        </button>

        <nav className="side-nav" aria-label="Dashboard navigation">
          {dashboardTabs.map(({ id, label, icon: Icon }) => (
            <button
              className={activeView === id ? "active" : ""}
              key={id}
              onClick={() => navigateToView(id)}
              type="button"
              title={label}
              aria-label={label}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <button className="ghost-button" onClick={handleLogout} type="button">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      <section className="dashboard-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Vault dashboard</p>
            <h1>
              {activeView === "overview" && "Your vault, at a glance."}
              {activeView === "documents" && "All documents, beautifully organized."}
              {activeView === "upload" && "Add something important."}
              {activeView === "profile" && "Your profile, in your control."}
            </h1>
          </div>
          <div className="profile-chip">
            <span>{getInitials(email)}</span>
            <div>
              <strong>{email}</strong>
              <small>Active session</small>
            </div>
          </div>
        </header>

        {message && <p className="banner-message">{message}</p>}

        {activeView === "overview" && (
          <section className="overview-view">
            <section className="hero-dashboard">
              <div>
                <p className="eyebrow">Private workspace</p>
                <h2>Everything important, one secure click away.</h2>
                <p>
                  A calm place for certificates, letters, IDs, screenshots, and records
                  that should never feel lost.
                </p>
              </div>
              <button className="primary-button slim" onClick={() => navigateToView("upload")} type="button">
                <UploadCloud size={18} />
                Upload document
              </button>
            </section>

            <section className="metric-grid" aria-label="Vault summary">
              <div className="metric-panel floating-card delay-one">
                <FileText size={19} />
                <span>Total files</span>
                <strong>{files.length}</strong>
              </div>
              <div className="metric-panel floating-card delay-two">
                <ShieldCheck size={19} />
                <span>Storage used</span>
                <strong>{formatSize(totalStorage)}</strong>
              </div>
              <div className="metric-panel floating-card delay-three">
                <UploadCloud size={19} />
                <span>Latest upload</span>
                <strong>{files[0]?.originalName ? "Available" : "None"}</strong>
              </div>
            </section>

            <section className="insight-grid">
              <div className="insight-panel">
                <span>01</span>
                <strong>Search-ready library</strong>
                <p>Find uploaded documents by name without scrolling through folders.</p>
              </div>
              <div className="insight-panel">
                <span>02</span>
                <strong>Fast download links</strong>
                <p>Open saved files from the dashboard whenever you need them.</p>
              </div>
              <div className="insight-panel">
                <span>03</span>
                <strong>Clean vault control</strong>
                <p>Remove outdated files and keep your workspace intentional.</p>
              </div>
            </section>

            <section className="recent-strip">
              <div>
                <p className="eyebrow">Recent</p>
                <h2>Latest documents</h2>
              </div>
              <button className="ghost-button inline" onClick={() => navigateToView("documents")} type="button">
                <FolderLock size={17} />
                View all
              </button>
              <div className="mini-file-list">
                {files.slice(0, 3).map((file) => (
                  <button className="mini-file" key={file._id} onClick={() => handleDownload(file._id)} type="button">
                    <span><FileText size={18} /></span>
                    <strong>{file.originalName}</strong>
                  </button>
                ))}
                {files.length === 0 && <p className="quiet-note">No uploads yet.</p>}
              </div>
            </section>
          </section>
        )}



        

        {activeView === "documents" && (
          <section className="document-area">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Library</p>
                <h2>Uploaded documents</h2>
              </div>
              <input
                className="search-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search documents"
                type="search"
              />
            </div>

            <div className="file-list">
              {filteredFiles.length === 0 ? (
                <div className="empty-state">
                  <strong>No documents found</strong>
                  <span>Upload your first file to start building the vault.</span>
                </div>
              ) : (
                filteredFiles.map((file) => (
                  <article className="file-row" key={file._id}>
                    <div className="file-icon"><FileText size={20} /></div>
                    <div className="file-info">
                      <strong>{file.originalName}</strong>
                      <span>{formatSize(file.size)} - {new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="file-actions">
                      <button type="button" onClick={() => handleDownload(file._id)}>
                        <Download size={16} />
                        Download
                      </button>
                      <button type="button" onClick={() => handleDelete(file._id)}>
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {activeView === "upload" && (
          <section className="upload-screen">
            <section className="upload-area">
              <p className="eyebrow">Add document</p>
              <h2>Upload to vault</h2>
              <p>
                Add PDFs, certificates, screenshots, letters, or any important file you
                want to keep close.
              </p>

              <form className="upload-form" onSubmit={handleUpload}>
                <label className="drop-zone">
                  <UploadCloud size={26} />
                  <span>{selectedFile ? selectedFile.name : "Choose a file"}</span>
                  <small>{selectedFile ? formatSize(selectedFile.size) : "PDF, image, or document"}</small>
                  <input
                    type="file"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                  />
                </label>

                <button className="primary-button" disabled={isBusy} type="submit">
                  {isBusy ? "Working..." : "Upload document"}
                </button>
              </form>
            </section>
            <section className="upload-guide">
              <p className="eyebrow">What fits here</p>
              <h2>Your important stack</h2>
              <div className="guide-list">
                <span>Certificates</span>
                <span>Internship letters</span>
                <span>Identity documents</span>
                <span>Receipts and records</span>
              </div>
            </section>
          </section>
        )}

        {activeView === "profile" && (
          <section className="profile-screen">
            <section className="profile-summary">
              <div className="profile-avatar-container" style={{ position: "relative", width: "100px", height: "100px", margin: "0 auto" }}>
                {profile?.profileImage ? (
                  <img src={`${API.defaults.baseURL}/uploads/${profile.profileImage}`} alt="Profile" className="profile-avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", margin: 0 }} />
                ) : (
                  <div className="profile-avatar" style={{ width: "100%", height: "100%", margin: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {getInitials(profile?.email || email)}
                  </div>
                )}
                <label style={{ display: "block", marginTop: "10px", cursor: "pointer", color: "var(--primary-color, #007bff)", textAlign: "center", fontSize: "0.875rem" }}>
                  Change Image
                  <input type="file" style={{ display: "none" }} onChange={handleProfileImageUpload} accept=".jpg,.jpeg,.png,.webp" />
                </label>
              </div>
              <small style={{ display: "block", textAlign: "center", marginTop: "40px", color: "var(--text-muted, #6c757d)", fontSize: "0.75rem" }}>
                Users can upload JPG, JPEG, PNG, and WEBP images with a maximum size of 5MB per file.
              </small>
              <p className="eyebrow">Registered user</p>
              <h2>{profile?.name || "Digital Vault User"}</h2>
              <p>{profile?.email || email}</p>
              <div className="profile-facts">
                <span>{profile?.phone || "Phone not added"}</span>
                <span>{profile?.gender ? profile.gender[0].toUpperCase() + profile.gender.slice(1) : "Gender not added"}</span>
              </div>
            </section>

            <section className="profile-editor">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Account details</p>
                  <h2>Edit profile</h2>
                </div>
              </div>

              <form className="profile-form" onSubmit={handleProfileSave}>
                <div className="form-grid">
                  <label>
                    First name
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(event) => handleProfileChange("firstName", event.target.value)}
                      required
                    />
                  </label>

                  <label>
                    Second name
                    <input
                      type="text"
                      value={profileForm.secondName}
                      onChange={(event) => handleProfileChange("secondName", event.target.value)}
                      required
                    />
                  </label>
                </div>

                <label>
                  Email address
                  <input type="email" value={profileForm.email} disabled />
                </label>

                <label>
                  Phone number
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(event) => {
                      console.log(event.target.value)
                      handleProfileChange("phone", event.target.value.replace(/[^\d+\s-]/g, ""))
                    }
                    }
                    required
                  />
                </label>

                <fieldset className="gender-field profile-gender">
                  <legend>Gender</legend>
                  {["male", "female", "others"].map((option) => (
                    <button
                      className={profileForm.gender === option ? "active" : ""}
                      key={option}
                      onClick={() => handleProfileChange("gender", option)}
                      type="button"
                    >
                      {option[0].toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </fieldset>
                {authFormik.touched.gender && authFormik.errors.gender && (
                  <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{authFormik.errors.gender}</div>
                )}

                <button className="primary-button slim" disabled={isBusy} type="submit">
                  {isBusy ? "Saving..." : "Save profile"}
                </button>
              </form>
            </section>
          </section>
        )}
      </section>

      {uploadSnackOpen && (
        <aside className="upload-snackbar" role="status" aria-live="polite">
          <CheckCircle2 size={22} />
          <strong>The file uploaded successfully.</strong>
          <button className="snackbar-view" onClick={handleViewUploadedFiles} type="button">
            VIEW
          </button>
          <button
            className="snackbar-close"
            onClick={() => setUploadSnackOpen(false)}
            type="button"
            aria-label="Close upload notification"
          >
            <X size={20} />
          </button>
        </aside>
      )}
    </main>
  );
}

export default App;
