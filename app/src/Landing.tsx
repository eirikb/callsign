import { React } from "./dd";

export const Landing = () => (
  <div class="font-sans bg-white flex flex-col min-h-screen w-full">
    <div>
      <div class="bg-gray-200 px-4 py-4">
        <div class="w-full md:max-w-6xl md:mx-auto md:flex md:items-center md:justify-between">
          <div>
            <a
              href="#"
              class="inline-block py-2 text-gray-800 text-2xl font-bold"
            ></a>
          </div>

          <div>
            <div>
              <a
                target="_blank"
                href="https://github.com/eirikb/callsign#callsign"
                class="inline-block py-1 md:py-4 text-gray-600 mr-6"
              >
                How it Works
              </a>
              <a
                href="#"
                class="inline-block py-1 md:py-4 text-gray-500 hover:text-gray-600 mr-6"
              ></a>

              <a
                href="#"
                class="inline-block py-1 md:py-4 text-gray-500 hover:text-gray-600 mr-6"
              ></a>
              <a
                href="#"
                class="inline-block py-1 md:py-4 text-gray-500 hover:text-gray-600 mr-6"
              ></a>
            </div>
          </div>

          <div class="hidden md:block">
            <a
              href="#"
              class="inline-block py-1 md:py-4 text-gray-500 hover:text-gray-600 mr-6"
            >
              Login / Connect
            </a>
            <a
              href="#"
              class="inline-block py-2 px-4 text-gray-700 bg-white hover:bg-gray-100 rounded-lg"
            >
              Create a free test-callsign
            </a>
          </div>
        </div>
      </div>

      <div class="bg-gray-200 md:overflow-hidden">
        <div class="px-4 py-16">
          <div class="relative w-full md:max-w-2xl md:mx-auto text-center">
            <h1 class="font-bold text-gray-700 text-xl sm:text-2xl md:text-5xl leading-tight mb-6">
              Callsign
            </h1>

            <p class="text-gray-600 md:text-xl md:px-18">
              <i>True</i> End-to-End Encrypted data sharing.
            </p>
          </div>
        </div>

        <svg
          class="fill-current bg-gray-200 text-white hidden md:block"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
        >
          <path
            fill-opacity="1"
            d="M0,64L120,85.3C240,107,480,149,720,149.3C960,149,1200,107,1320,85.3L1440,64L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z"
          ></path>
        </svg>
      </div>

      <div
        class="max-w-4xl mx-auto bg-white shadow-lg relative z-20 hidden md:block"
        style="margin-top: -320px; border-radius: 20px; z-index: 100"
      >
        <div
          class="h-5 w-5 rounded-full bg-blue-500 absolute top-0 left-0 -ml-32 mt-12"
          style="z-index: -1;"
        ></div>

        <div class="flex" style="height: 550px;padding:10px">
          <img
            style="border-radius: 20px; opacity:0.8"
            src="https://raw.githubusercontent.com/eirikb/callsign/main/logo.jpg"
            alt=""
          />
        </div>
        <div class="h-20 w-20 rounded-full bg-yellow-500 absolute top-0 left-0 -ml-10 -mt-10"></div>
      </div>
    </div>
  </div>
);
