"use client";

import { Heading } from "@/ui/components/Heading";
import Roadmap from "@/ui/components/Roadmap";
import { FormField } from "@/ui/components/inputs/FormInput";
import { Form, FormizStep } from "@formiz/core";
import axios from "axios";
import { forwardRef, type ElementRef, type ComponentProps } from "react";

export const IntroStep = forwardRef<
  ElementRef<"div">,
  ComponentProps<"div"> & { form: Form }
>(({ form, ...props }, _ref) => {
  async function getName() {
    const name = await (await axios.get("/api/cool-name")).data.name;
    if (name) form.setFieldsValues({ bot_name: name });
  }
  return (
    <FormizStep name="intro">
      <div ref={_ref} className="fade-in-0 animate-in">
        <div className="flex flex-col items-start gap-1">
          <Heading level={3}>Let's create your own product copilot 🔥</Heading>
          <Heading level={6} className="text-slate-400">
            and here how we are going to do it:
          </Heading>
        </div>
        <div className="my-8 px-2">
          <Roadmap
            items={[
              {
                label: "Your API definition (Swagger)",
                description:
                  "We will use this definition to give your copilot the ability of understanding your product.",
              },
              {
                label: "We validate your API definition",
                description:
                  "We will validate your swagger file to make sure that it is valid and that we can understand it. ",
              },
              {
                label: "You integrate the copilot on your product",
                description:
                  "That is it! we will provide you with a Javascript code to put it on your product.",
              },
            ]}
          />
          <FormField
            label="Bot Name"
            wrapperClassName="mt-4"
            name="bot_name"
            type="text"
            required
            onFocus={() => !form.fields.bot_name.value && getName()}
          />
        </div>
      </div>
    </FormizStep>
  );
});
IntroStep.displayName = "IntroStep";
