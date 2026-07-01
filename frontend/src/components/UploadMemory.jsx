import { useState } from "react";


function UploadMemory() {


  const [file, setFile] = useState(null);


const uploadFile = async () => {


    if(!file){

      alert("Please select a file first");

      return;

    }



    const formData = new FormData();


    formData.append("file", file);



    try {


      const response = await fetch("http://localhost:5000/upload", {

        method: "POST",

        body: formData

      });



      const data = await response.json();


      console.log(data);


      alert("File uploaded successfully");


    }


    catch(error){


      console.log(error);


      alert("Upload failed");


    }


};




  return (

    <div className="
    mt-10
    bg-white/5
    border
    border-white/10
    rounded-3xl
    p-8
    ">


      <h2 className="
      text-2xl
      font-semibold
      ">

        Add New Memory

      </h2>



      <input

      type="file"

      onChange={(e)=>setFile(e.target.files[0])}

      className="
      mt-6
      text-gray-400
      "

      />



      <button

      onClick={uploadFile}

      className="
      mt-6
      px-6
      py-3
      bg-white
      text-black
      rounded-full
      hover:scale-105
      transition
      "

      >

        Upload

      </button>


    </div>

  )

}


export default UploadMemory;