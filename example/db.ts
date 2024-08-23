export interface Database {
	findGradesByStudentId(id: string): Promise<number[] | undefined>;
}

export const db = {} as Database;
