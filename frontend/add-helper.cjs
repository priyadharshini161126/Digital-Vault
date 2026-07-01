const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf-8');

const fields = ["firstName", "secondName", "phone", "email", "password"];

for (const field of fields) {
  // Regex to match the input element of that field and insert the error div below it, before the closing </label>
  const regex = new RegExp(
    `(<input[^>]*name="${field}"[^>]*/>)`,
    'g'
  );
  content = content.replace(regex, 
    `$1\n                      {authFormik.touched.${field} && authFormik.errors.${field} && (\n                        <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{authFormik.errors.${field}}</div>\n                      )}`
  );
}

// For gender (fieldset)
const genderRegex = /(<\/fieldset>)/g;
content = content.replace(genderRegex, 
  `$1\n                  {authFormik.touched.gender && authFormik.errors.gender && (\n                    <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{authFormik.errors.gender}</div>\n                  )}`
);

fs.writeFileSync('src/App.jsx', content);
console.log('updated src/App.jsx helper text');
