import { Point3DocConfig } from "../config";

export interface S3Config extends Point3DocConfig {
	s3: {
		docS3Path: string;
		endpoint: string;
		region: string;
	}
}
