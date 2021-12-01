import { data, don, path, React } from "./dd";

async function doGoogle() {
  console.log("CONNECT WITH GOOGLE! :D");
}

export const Create = () => {
  return (
    <div class="flex h-screen">
      <div class="m-auto">
        <div class="p-8 shadow-lg rounded-xl text-center bg-white">
          <button
            onclick={doGoogle}
            class="bg-red-100 p-2 pr-5 pl-5 text-gray-800 font-semibold rounded m-4"
          >
            Google
          </button>
        </div>
      </div>
    </div>
  );
};
