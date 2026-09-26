import { cache } from "react";
import { readCourse, listCourses } from "./store";

// Deduplicate within a request only. Routes are dynamic, so CLI publication needs no webhook.
export const getCourse = cache(readCourse);
export const getCourses = cache(listCourses);
