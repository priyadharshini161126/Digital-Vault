function Features() {

  const features = [
    {
      icon: "🔒",
      title: "Private Storage",
      description:
        "Keep your documents, ideas and memories secured in your personal vault."
    },

    {
      icon: "🧠",
      title: "Smart Organization",
      description:
        "Organize your knowledge into a connected digital memory system."
    },

    {
      icon: "⚡",
      title: "Instant Search",
      description:
        "Find your important memories quickly whenever you need them."
    }
  ];


  return (

    <section className="
    px-20
    py-20
    ">


      <h2 className="
      text-4xl
      font-semibold
      text-center
      ">

        Why Digital Vault?

      </h2>



      <div className="
      mt-12
      grid
      grid-cols-3
      gap-8
      ">


        {features.map((feature, index) => (

          <div
          key={index}
          className="
          bg-white/5
          border
          border-white/10
          rounded-3xl
          p-8
          backdrop-blur-xl
          hover:-translate-y-3
          transition-all
          duration-300
          ">


            <div className="text-4xl">

              {feature.icon}

            </div>


            <h3 className="
            mt-6
            text-xl
            font-medium
            ">

              {feature.title}

            </h3>


            <p className="
            mt-4
            text-gray-400
            ">

              {feature.description}

            </p>


          </div>


        ))}


      </div>


    </section>

  )

}


export default Features;