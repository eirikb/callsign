import { data, don, path, React } from "./dd";
import { exportPrivateKey, exportPublicKey, generateKey } from "./cryptomatic";
import { Panel } from "./components";

async function createKeys() {
  const keys = await generateKey();
  data.createKey.publicKey = await exportPublicKey(keys.publicKey);
  data.createKey.privateKey = await exportPrivateKey(keys.privateKey);
}

export const CreateKeys = () => {
  return <Panel></Panel>;
  // return (
  // <div class="flex h-screen">
  //   <div class="m-auto">
  //     <div class="p-8 shadow-lg rounded-xl text-center bg-white">
  //       <div class="flex flex-col">
  //         <a
  //           class="text-left text-blue-500 cursor-pointer"
  //           onClick={() => (data.panel = "home")}
  //         >
  //           Back
  //         </a>
  //       </div>
  //       <div>
  //         <div class="pt-2 flex flex-col ml-20 mr-20">
  //           <div>Upload this to your server:</div>
  //           <div class="text-left">
  //             <textarea
  //               bind={path().createKey.publicKey.$path}
  //               placeholder="Public key"
  //               class="p-1 rounded-lg bg-gray-100 shadow-md focus:outline-none focus:border-2 border-cyan-500"
  //             />
  //           </div>
  //           <div>Keep this secret:</div>
  //           <input
  //             placeholder="Private key"
  //             bind={path().createKey.privateKey.$path}
  //             class="p-1 mt-3 rounded-lg bg-gray-100 shadow-md focus:outline-none focus:border-2 border-cyan-500"
  //           />
  //           <button
  //             type="button"
  //             onClick={createKeys}
  //             class="bg-cyan-200 p-2 pr-5 pl-5 text-gray-800 font-semibold border-cyan-700 focus:ring-2 m-4"
  //           >
  //             Create keys
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // </div>
  // );
};
