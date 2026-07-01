import Sidebar from "../components/Sidebar";

import {
  Search,
  FileText,
  Clock3,
  Sparkles
} from "lucide-react";



function Dashboard(){


return (

<div className="
min-h-screen
bg-[#05070B]
text-white
">


<Sidebar />



<div className="
ml-64
p-10
">


{/* Header */}

<div className="
flex
justify-between
items-center
">


<div>

<h1 className="
text-3xl
font-medium
tracking-tight
">

Welcome back 👋

</h1>


<p className="
text-gray-400
mt-2
">

Your private memory space.

</p>


</div>



<div className="
bg-white/5
border
border-white/10
px-5
py-3
rounded-full
flex
gap-3
items-center
">


<Search size={18}/>


<span className="text-gray-400">

Search

</span>


</div>


</div>





{/* Cards */}


<div className="
grid
grid-cols-3
gap-6

mt-12

">


<div className="
bg-[#0D1117]

border
border-white/10

rounded-3xl

p-6

hover:border-white/20

transition
">


<FileText size={28}/>


<h2 className="
mt-6
text-lg
font-medium
">

Memories

</h2>


<p className="
text-gray-400
mt-2
">

Your saved files

</p>


</div>





<div className="
bg-[#0D1117]

border
border-white/10

rounded-3xl

p-6

hover:border-white/20

transition
">


<Clock3 size={28}/>


<h2 className="
mt-6
text-lg
font-medium
">

Timeline

</h2>


<p className="
text-gray-400
mt-2
">

Your journey history

</p>


</div>






<div className="
bg-[#0D1117]

border
border-white/10

rounded-3xl

p-6

hover:border-white/20

transition
">


<Sparkles size={28}/>


<h2 className="
mt-6
text-lg
font-medium
">

AI Brain

</h2>


<p className="
text-gray-400
mt-2
">

Chat with your vault

</p>


</div>



</div>



</div>


</div>


)


}


export default Dashboard;