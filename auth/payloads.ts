import { Checksum } from "../values";

export type IdentificationTokenPayload = {
    attribute: string;
    value: Checksum | string;
};
