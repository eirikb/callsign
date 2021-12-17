import { BackLink, Button, Panel } from "./components";
import { React, data, don, path } from "./dd";

const Cancel = () => (
  <Button onClick={() => (data.flow.subFlow = "init")}>Cancel</Button>
);

const SelfHosted = () => (
  <div>
    <ol class="list-decimal text-left">
      <li>Set up a domain</li>
      <li>Set up a server</li>
      <li>Create a key pair</li>
      <li>Upload the public key to your server</li>
      <li>
        Name it like this:
        <br />
        https://your-callsign.com/your-callsign.com.key
      </li>
      <li>Use the private key to log into this site. Keep this key safe</li>
    </ol>
    <hr class="m-5" />
    <p>To create a key pair</p>
    <div>
      <Button onClick={() => (data.panel = "createKeys")}>Click here</Button>
    </div>
    <hr class="m-5" />
    <div class="text-left">
      Your callsign will not be associated with this site. <br />
      This site is only a medium to handle communications. <br />
      Your callsign is decentralized and can be used to ensure <br />
      end-to-end-encryption through other channels. <br />
      You will have your callsign for years to come.
    </div>
    <Cancel />
  </div>
);

const DemoUser = () => (
  <div>
    <p>To register a new demo user</p>
    <div>
      <Button onClick={() => (data.panel = "registerUser")}>Click here</Button>
    </div>
    <p>Already have a user but want to upload a new key?</p>
    <div>
      <Button onClick={() => (data.panel = "uploadKey")}>Click here</Button>
    </div>
    <Cancel />
  </div>
);

const Init = () => (
  <div>
    <p>Want to create your own callsign?</p>
    <div>
      <Button onClick={() => (data.flow.subFlow = "selfHosted")}>
        Click here
      </Button>
    </div>

    <p>Want to test out the service with a demo user?</p>
    <div>
      <Button onClick={() => (data.flow.subFlow = "demoUser")}>
        Click here
      </Button>
    </div>
  </div>
);

export const Flow = ({}, { mounted }) => {
  mounted(() => {
    data.flow.subFlow = "init";
  });
  return (
    <Panel>
      <BackLink />

      {don(path().flow.subFlow).map((subFlow) => {
        switch (subFlow) {
          case "selfHosted":
            return <SelfHosted />;
          case "demoUser":
            return <DemoUser />;
          default:
            return <Init />;
        }
      })}
    </Panel>
  );
};
