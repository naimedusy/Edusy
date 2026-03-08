import prisma from './db';

/**
 * Helper to get the maximum numeric value of a metadata field.
 */
async function getMaxMetadataValue(instituteId: string, filterExtras: any, fieldName: string): Promise<number> {
    // Try to match both string and ObjectId for flexibility
    const filter: any = {
        role: 'STUDENT',
        $or: [
            { instituteIds: instituteId },
            { instituteIds: { $oid: instituteId } }
        ],
        [`metadata.${fieldName}`]: { $exists: true, $ne: "" }
    };

    // Integrate filterExtras (like classId) into the or/match logic
    if (filterExtras['metadata.classId']) {
        const classId = filterExtras['metadata.classId'];
        filter.$and = [
            {
                $or: [
                    { 'metadata.classId': classId },
                    { 'metadata.classId': { $oid: classId } }
                ]
            }
        ];
    }

    try {
        const result = await (prisma as any).$runCommandRaw({
            aggregate: 'User',
            pipeline: [
                { $match: filter },
                {
                    $project: {
                        numericVal: {
                            $convert: {
                                input: `$metadata.${fieldName}`,
                                to: "int",
                                onError: 0,
                                onNull: 0
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        maxVal: { $max: "$numericVal" }
                    }
                }
            ],
            cursor: {}
        });

        return result.cursor?.firstBatch?.[0]?.maxVal || 0;
    } catch (error) {
        console.error(`Error in getMaxMetadataValue for field ${fieldName}:`, error);
        // Fallback or rethrow? For now, rethrow so it's caught by the API route and logged there
        throw error;
    }
}

/**
 * Calculates the next available Student ID for an institute.
 * Returns a 4-digit zero-padded string (e.g., "0001", "0025").
 */
export async function getNextStudentId(instituteId: string): Promise<string> {
    const maxId = await getMaxMetadataValue(instituteId, {}, 'studentId');
    return (maxId + 1).toString().padStart(4, '0');
}

/**
 * Calculates the next available Roll Number for a class within an institute.
 * Returns a string representing the number (e.g., "1", "12").
 */
export async function getNextRollNumber(instituteId: string, classId: string): Promise<string> {
    if (!classId) return "1";
    const maxRoll = await getMaxMetadataValue(instituteId, { 'metadata.classId': classId }, 'rollNumber');
    return (maxRoll + 1).toString();
}
