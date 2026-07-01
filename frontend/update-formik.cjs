const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf-8');

// 1. Add imports
content = content.replace(
  'import API from "./api/axios";',
  'import API from "./api/axios";\nimport { useFormik } from "formik";\nimport * as Yup from "yup";'
);

// 2. Add validation schemas
const schemas = `
const loginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().required("Required"),
});

const signupSchema = Yup.object().shape({
  firstName: Yup.string().required("Required"),
  secondName: Yup.string().required("Required"),
  phone: Yup.string().required("Required"),
  gender: Yup.string().oneOf(["male", "female", "others"]).required("Required"),
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().required("Required"),
});
`;

content = content.replace('function App() {', schemas + '\nfunction App() {');

// 3. Add useFormik inside App
const formikHook = `
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
`;

content = content.replace('const authHeaders = useMemo(', formikHook + '\n  const authHeaders = useMemo(');

// 4. Update handleLogin and handleSignup
content = content.replace(
  'const handleLogin = async (event) => {\n    event.preventDefault();',
  'const handleLoginSubmit = async (values) => {'
);
content = content.replace(
  'const response = await API.post("/auth/login", {\n        email,\n        password,\n      });',
  'const response = await API.post("/auth/login", {\n        email: values.email,\n        password: values.password,\n      });\n      setEmail(values.email);\n      setPassword(values.password);'
);

content = content.replace(
  'const handleSignup = async (event) => {\n    event.preventDefault();',
  'const handleSignupSubmit = async (values) => {'
);

content = content.replace(
  'await API.post("/auth/register", {\n        firstName,\n        secondName,\n        phone,\n        gender,\n        email,\n        password,\n      });',
  'await API.post("/auth/register", {\n        firstName: values.firstName,\n        secondName: values.secondName,\n        phone: values.phone,\n        gender: values.gender,\n        email: values.email,\n        password: values.password,\n      });\n      setEmail(values.email);\n      setPassword(values.password);'
);

// 5. Update form elements
content = content.replace(
  '<form onSubmit={authMode === "signin" ? handleLogin : handleSignup}>',
  '<form onSubmit={authFormik.handleSubmit}>'
);

content = content.replace(
  /value=\{firstName\}\s*onChange=\{\(event\) => setFirstName\(event.target.value\)\}\s*placeholder="First name"\s*autoComplete="given-name"\s*required/g,
  'name="firstName" value={authFormik.values.firstName} onChange={authFormik.handleChange} onBlur={authFormik.handleBlur} placeholder="First name" autoComplete="given-name" style={authFormik.touched.firstName && authFormik.errors.firstName ? { borderColor: "red" } : {}}'
);

content = content.replace(
  /value=\{secondName\}\s*onChange=\{\(event\) => setSecondName\(event.target.value\)\}\s*placeholder="Second name"\s*autoComplete="family-name"\s*required/g,
  'name="secondName" value={authFormik.values.secondName} onChange={authFormik.handleChange} onBlur={authFormik.handleBlur} placeholder="Second name" autoComplete="family-name" style={authFormik.touched.secondName && authFormik.errors.secondName ? { borderColor: "red" } : {}}'
);

content = content.replace(
  /value=\{phone\}\s*onChange=\{\(event\) => setPhone\(event.target.value\.replace\(\/\[\^\\d\+\\s-\]\/g, ""\)\)\}\s*placeholder="Phone number"\s*autoComplete="tel"\s*required/g,
  'name="phone" value={authFormik.values.phone} onChange={(e) => { authFormik.handleChange(e); authFormik.setFieldValue("phone", e.target.value.replace(/[^\\\\d+\\\\s-]/g, "")); }} onBlur={authFormik.handleBlur} placeholder="Phone number" autoComplete="tel" style={authFormik.touched.phone && authFormik.errors.phone ? { borderColor: "red" } : {}}'
);

content = content.replace(
  /<fieldset className="gender-field">/,
  '<fieldset className="gender-field" style={authFormik.touched.gender && authFormik.errors.gender ? { border: "1px solid red", borderRadius: "8px", padding: "8px" } : {}}>'
);

content = content.replace(
  /className=\{gender === option \? "active" : ""\}/g,
  'className={authFormik.values.gender === option ? "active" : ""}'
);

content = content.replace(
  /onClick=\{\(\) => setGender\(option\)\}/g,
  'onClick={() => { authFormik.setFieldValue("gender", option); authFormik.setFieldTouched("gender", true, false); }}'
);

content = content.replace(
  /value=\{email\}\s*onChange=\{\(event\) => setEmail\(event.target.value\)\}\s*placeholder="name@example\.com"\s*autoComplete="email"\s*required/g,
  'name="email" value={authFormik.values.email} onChange={authFormik.handleChange} onBlur={authFormik.handleBlur} placeholder="name@example.com" autoComplete="email" style={authFormik.touched.email && authFormik.errors.email ? { borderColor: "red" } : {}}'
);

content = content.replace(
  /value=\{password\}\s*onChange=\{\(event\) => setPassword\(event.target.value\)\}\s*placeholder="Enter your password"\s*autoComplete=\{authMode === "signin" \? "current-password" : "new-password"\}\s*required/g,
  'name="password" value={authFormik.values.password} onChange={authFormik.handleChange} onBlur={authFormik.handleBlur} placeholder="Enter your password" autoComplete={authMode === "signin" ? "current-password" : "new-password"} style={authFormik.touched.password && authFormik.errors.password ? { borderColor: "red" } : {}}'
);

fs.writeFileSync('src/App.jsx', content);
console.log('updated src/App.jsx');
