import { getInput as coreGetInput } from "@actions/core";

export const getInput = (name: string): string | undefined => {
	return coreGetInput(name) === "" ? undefined : coreGetInput(name);
};
