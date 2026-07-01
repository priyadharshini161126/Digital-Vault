import { useNavigate } from "react-router-dom";
function Hero() {

    const navigate = useNavigate();
  return (

    <section className="
    min-h-screen
    flex
    items-center
    justify-between
    px-20
    overflow-hidden
    ">


      {/* LEFT SIDE */}

      <div className="max-w-xl">


        <h1 className="
        text-6xl
        font-semibold
        leading-tight
        tracking-tight
        ">

          Your memories.
          <br />

          One intelligent vault.

        </h1>


        <p className="
        mt-6
        text-gray-400
        text-lg
        leading-relaxed
        ">

          Store your documents, ideas and knowledge
          in one private digital space built for your
          future.

        </p>


        <button

        onClick={() => navigate("/dashboard")}
        className="
        mt-8
        px-8
        py-3
        rounded-full
        bg-white
        text-black
        font-medium
        hover:scale-105
        transition-all
        duration-300
        ">

          Enter Vault

        </button>


      </div>



      {/* APPLE STYLE FLOATING VAULT */}


      <div
      className="
      w-96
      h-96
      rounded-[40px]
      bg-white/5
      border
      border-white/10
      backdrop-blur-2xl
      flex
      items-center
      justify-center
      shadow-2xl
      animate-float
      ">


        <div
        className="
        w-72
        h-72
        rounded-[32px]
        bg-black/60
        border
        border-white/10
        p-8
        ">


          <h2 className="
          text-xl
          font-medium
          ">

            🧠 Memory Core

          </h2>



          <div className="
          mt-8
          space-y-4
          ">



            <div
            className="
            bg-white/5
            border
            border-white/10
            rounded-2xl
            p-4
            hover:bg-white/10
            transition
            ">

              📄 Documents

            </div>



            <div
            className="
            bg-white/5
            border
            border-white/10
            rounded-2xl
            p-4
            hover:bg-white/10
            transition
            ">

              💡 Ideas

            </div>



            <div
            className="
            bg-white/5
            border
            border-white/10
            rounded-2xl
            p-4
            hover:bg-white/10
            transition
            ">

              🎓 Knowledge

            </div>


          </div>


        </div>


      </div>



    </section>

  )

}


export default Hero;