import { React, data } from "./dd";

export const Panel = ({}, { children }) => (
  <div class="flex h-screen">
    <div class="m-auto">
      <div class="p-8 shadow-lg rounded-xl text-center bg-white">
        {children}
      </div>
    </div>
  </div>
);

export const BackLink = () => (
  <a
    class="text-left text-blue-500 cursor-pointer"
    onClick={() => (data.panel = "home")}
  >
    Back
  </a>
);

export const Input = ({ label, bind, type = "text" }) => (
  <div class="flex flex-col">
    <label class="text-gray-700 text-sm">{label}</label>
    <input
      class="w-full p-2 border rounded-lg border-gray-400"
      bind={bind}
      placeholder={label}
      type={type}
    />
  </div>
);

export const TextArea = ({ label, bind }) => (
  <div class="flex flex-col">
    <label class="text-gray-700 text-sm">{label}</label>
    <textarea class="w-full p-2 border rounded-lg border-gray-400" bind={bind}>
      {" "}
    </textarea>
  </div>
);

export const Button = (
  { onClick = () => {}, type = "button" },
  { children }
) => (
  <button
    type={type}
    onClick={onClick}
    class="bg-cyan-200 p-2 pr-5 pl-5 text-gray-800 font-semibold border-cyan-700 focus:ring-2 m-4"
  >
    {children}
  </button>
);
