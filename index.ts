import express from "express";
import { AddStudentSchema, AttendanceStartSchema, CreateClassSchema, SigninSchema, SignupSchema } from "./types";
import { hashPassword, verifyPassword } from "./utils/hashPassword";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { authMiddleware, errorHandler, teacherRoleMiddleware } from "./middleware";
import { asyncHandler } from "./utils/asyncHandler";
import { AttendanceModel, UserModel, ClassModel } from "./models";
import expressWs from "express-ws";

let activeSession: {
    classId: string,
    startedAt: Date,
    attendance: Record<string, string>,
    teacherId: string | undefined
} | null = null;
const app = express();
expressWs(app);
app.use(express.json());
/**
 * HTTP Layer 100 % tests passing 
 */
app.post("/auth/signup", asyncHandler(async (req, res) => {
    const { success, data } = SignupSchema.safeParse(req.body);
    if (!success) {
        res.status(400).json({
            "success": false,
            "error": "Invalid request schema"
        });
        return;
    }
    const user = await UserModel.findOne({
        email: data.email
    });
    if (user) {
        res.status(400).json({
            "success": false,
            "error": "Email already exists"
        })
        return;
    }
    const hashedPassword = await hashPassword(data.password);
    const userDB = await UserModel.create({
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role
    });
    res.status(201).json({
        success: true,
        data: {
            _id: userDB._id,
            name: userDB.name,
            email: userDB.email,
            role: userDB.role
        }
    });
}));
app.post("/auth/login", asyncHandler(async (req, res) => {
    const { data, success } = SigninSchema.safeParse(req.body);
    if (!success) {
        res.status(400).json({
            "success": false,
            "error": "Invalid request schema"
        });
        return;
    }


    const user = await UserModel.findOne({
        email: data.email
    });

    if (!user) {
        res.status(400).json({
            "success": false,
            "error": "Invalid email or password"
        })
        return;;
    }

    const isMatching: boolean = await verifyPassword(data.password, user!.password);
    if (!user.password || !isMatching) {
        res.status(400).json({
            "success": false,
            "error": "Invalid email or password"
        })
        return;
    }
    const token = jwt.sign({
        role: user.role,
        userId: user._id
    }, process.env.JWT_PASSWORD!);
    res.status(200).json({
        "success": true,
        "data": {
            "token": token
        }
    })
}));

app.get("/auth/me", authMiddleware, asyncHandler(async (req, res) => {

    const user = await UserModel.findOne({
        _id: req.userId
    });
    if (!user) {
        res.status(400).json({
            message: "Shouldn't reach here"
        });
        return;
    }
    res.status(200).json({
        "success": true,
        "data": {
            "_id": user._id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    })

}));
app.post("/class", authMiddleware, teacherRoleMiddleware, asyncHandler(async (req, res) => {
    const { success, data } = CreateClassSchema.safeParse(req.body);
    if (!success) {
        res.status(400).json({
            "success": false,
            "error": "Invalid request schema"
        });
        return;
    }
    const classDB = await ClassModel.create({
        className: data.className,
        teacherId: req.userId,
        studentIds: []
    });
    res.status(201).json({
        "success": true,
        "data": {
            "_id": classDB._id,
            "className": classDB.className,
            "teacherId": classDB.teacherId,
            "studentIds": []
        }
    });
}));

app.post("/class/:id/add-student", authMiddleware, teacherRoleMiddleware, asyncHandler(async (req, res) => {
    const { success, data } = AddStudentSchema.safeParse(req.body);
    if (!success) {
        res.status(400).json({
            "success": false,
            "error": "Invalid request schema"
        });
        return;
    }
    const studentId = data.studentId;
    const classDB = await ClassModel.findOne({
        _id: req.params.id
    });
    if (!classDB) {
        res.status(404).json({
            "success": false,
            "error": "Class not found"
        });
        return;
    }
    if (classDB.teacherId?.toString() !== req.userId) {
        res.status(403).json({
            "success": false,
            "error": "Forbidden, not class teacher"
        })
        return;
    }
    const user = await UserModel.findOne({
        _id: studentId
    });
    if (!user) {
        res.status(404).json({
            "success": false,
            "error": "Student not found"
        });
        return;
    }
    const updatedClass = await ClassModel.findByIdAndUpdate(
        classDB._id,
        { $addToSet: { studentIds: data.studentId } },
        { new: true, runValidators: true }
    );
    res.status(200).json({
        "success": true,
        "data": {
            "_id": updatedClass!._id,
            "className": updatedClass!.className,
            "teacherId": updatedClass!.teacherId,
            "studentIds": updatedClass!.studentIds
        }
    })
}))

app.get("/class/:id", authMiddleware, asyncHandler(async (req, res) => {
    const classDB = await ClassModel.findOne({
        _id: req.params.id
    });
    if (!classDB) {
        res.status(404).json({
            success: false,
            "error": "Class not found"
        });
        return;
    }
    if (classDB.teacherId?.toString() === req.userId || classDB.studentIds.map(x => x.toString()).includes(req.userId!)) {
        const studentsArr = await UserModel.find({ _id: { $in: classDB.studentIds }, role: "student" }).select("_id name role email");
        res.status(200).json({
            success: true,
            data: {
                _id: classDB._id,
                className: classDB.className,
                teacherId: classDB.teacherId,
                students: studentsArr.map(s => ({
                    _id: s._id,
                    name: s.name,
                    email: s.email
                }))
            }
        });
    } else {
        res.status(403).json({
            "success": false,
            "error": "Forbidden, not class teacher"
        });
        return;
    }
}))

app.get("/students", authMiddleware, teacherRoleMiddleware, asyncHandler(async (req, res) => {
    const students = await UserModel.find({ role: "student" }).select("_id name role email");
    res.status(200).json({
        "success": true,
        "data": students.map(s => ({
            "_id": s._id,
            "name": s.name,
            "email": s.email
        }))
    })
}))
app.get("/class/:id/my-attendance", authMiddleware, asyncHandler(async (req, res) => {
    const classId = req.params.id;
    const userId = req.userId;
    const attendance = await AttendanceModel.findOne({ classId: classId, studentId: userId })
    if (attendance) {
        res.status(200).json({
            "success": true,
            "data": {
                "classId": classId,
                "status": attendance.status
            }
        })
    } else {
        res.status(200).json({
            "success": true,
            "data": {
                "classId": classId,
                "status": null
            }
        })
    }
}))

app.post("/attendance/start", authMiddleware, teacherRoleMiddleware, asyncHandler(async (req, res) => {
    const { success, data } = AttendanceStartSchema.safeParse(req.body);
    if (!success) {
        res.status(400).json({
            "success": false,
            "error": "Invalid request schema"
        });
        return;
    }

    const classDB = await ClassModel.findOne({
        _id: data.classId
    });
    if (!classDB) {
        res.status(404).json({
            "success": false,
            "error": "Class not found"
        });
        return;
    }
    if (classDB.teacherId?.toString() !== req.userId) {
        res.status(403).json({
            "success": false,
            "error": "Forbidden, not class teacher"
        });
        return;
    }
    activeSession = {
        classId: classDB._id.toString(),
        startedAt: new Date(),
        attendance: {},
        teacherId: classDB.teacherId?.toString()
    }
    res.status(200).json({
        "success": true,
        "data": {
            "classId": classDB._id,
            "startedAt": activeSession.startedAt
        }
    })
}));

/**
 * Websocket Layer
 */
let allWs: any[] = [];
app.ws('/ws', function (ws, req) {

    try {
        const token = req.query.token;
        const { userId, role } = jwt.verify(token, process.env.JWT_PASSWORD!) as JwtPayload;
        ws.user = { userId: userId, role: role };
        allWs.push(ws);
        ws.on("close", () => {
            allWs = allWs.filter(x => x !== ws)
        })
        ws.on("message", async function (msg) {
            const message = msg.toString();
            let parsedData;
            try {
                parsedData = JSON.parse(msg.toString());
            } catch {
                ws.send(JSON.stringify({
                    event: "ERROR",
                    data: { message: "Invalid message format" }
                }));
                return;
            }

            switch (parsedData!.event) {
                case "ATTENDANCE_MARKED": {
                    if (!activeSession) {
                        ws.send(JSON.stringify({
                            "event": "ERROR",
                            "data": {
                                "message": "No active attendance session"
                            }
                        }));
                        break;
                    }
                    if (ws.user.role === "teacher" && ws.user.userId === activeSession?.teacherId) {
                        activeSession.attendance[parsedData.data.studentId] = parsedData.data.status;
                        allWs.forEach(ws => ws.send(JSON.stringify({
                            "event": "ATTENDANCE_MARKED",
                            "data": {
                                "studentId": parsedData.data.studentId,
                                "status": parsedData.data.status
                            }
                        })))
                    }
                    else {
                        ws.send(JSON.stringify({
                            "event": "ERROR",
                            "data": {
                                "message": "Forbidden, teacher event only"
                            }
                        }))
                    }
                    break;
                }
                case "TODAY_SUMMARY": {
                    if (!activeSession) {
                        ws.send(JSON.stringify({
                            "event": "ERROR",
                            "data": {
                                "message": "No active attendance session"
                            }
                        }));
                        break;
                    }
                    if (ws.user.role === "teacher" && ws.user.userId === activeSession?.teacherId) {
                        const classDB = await ClassModel.findOne({
                            _id: activeSession?.classId
                        });

                        const total = classDB?.studentIds.length ?? 0;
                        const present = Object.keys(activeSession?.attendance).filter(x => activeSession?.attendance[x] === "present").length;
                        const absent = total - present;
                        allWs.forEach(ws => ws.send(JSON.stringify({
                            "event": "TODAY_SUMMARY",
                            "data": {
                                "present": present,
                                "absent": absent,
                                "total": total
                            }
                        })))

                    } else {
                        ws.send(JSON.stringify({
                            "event": "ERROR",
                            "data": {
                                "message": "Forbidden, teacher event only"
                            }
                        }))
                    }
                    break;
                }
                case "MY_ATTENDANCE": {
                    if (!activeSession) {
                        ws.send(JSON.stringify({
                            "event": "ERROR",
                            "data": {
                                "message": "No active attendance session"
                            }
                        }));
                        break;
                    }
                    if (ws.user.role === "student") {
                        const status = activeSession?.attendance[ws.user.userId];

                        ws.send(JSON.stringify({
                            "event": "MY_ATTENDANCE",
                            "data": {
                                "status": status ?? "not yet updated"
                            }
                        })
                        )
                    } else {
                        ws.send(JSON.stringify({
                            "event": "ERROR",
                            "data": {
                                "message": "Forbidden, student event only"
                            }
                        }))
                    }
                    break;
                }
                case "DONE": {
                    if (!activeSession) {
                        ws.send(JSON.stringify({
                            "event": "ERROR",
                            "data": {
                                "message": "No active attendance session"
                            }
                        }));
                        break;
                    }
                    else if (ws.user.role === "teacher" && ws.user.userId === activeSession?.teacherId) {

                        const classDB = await ClassModel.findOne({
                            _id: activeSession?.classId
                        });
                        if (!classDB) break;
                        const total = classDB?.studentIds.length ?? 0;
                        const present = Object.keys(activeSession?.attendance).filter(x => activeSession?.attendance[x] === "present").length;
                        const absent = total - present;

                        const promises = classDB?.studentIds.map(async (studentId) => {
                            const recordedStatus = activeSession?.attendance[studentId.toString()];
                            await AttendanceModel.create({
                                studentId: studentId,
                                status: recordedStatus == "present" ? "present" : "absent",
                                classId: activeSession?.classId
                            });

                        });
                        await Promise.all(promises);
                        allWs.forEach(ws => ws.send(JSON.stringify({
                            "event": "DONE",
                            "data": {
                                "message": "Attendance persisted",
                                "present": present,
                                "absent": absent,
                                "total": total
                            }
                        })));
                        activeSession = null;


                    } else {
                        ws.send(JSON.stringify({
                            "event": "ERROR",
                            "data": {
                                "message": "Forbidden, teacher event only"
                            }
                        }))

                    }
                    break;

                }
                default: {
                    ws.send(JSON.stringify({
                        "event": "ERROR",
                        "data": {
                            "message": "Unknown event",
                        }
                    }))
                }
            }
            console.log(msg);
        })

    } catch (_) {
        ws.send(JSON.stringify({
            "event": "ERROR",
            "data": {
                "message": "Unauthorized or invalid token"
            }
        }));
        ws.close();
    }
});

//Centralized Error Middleware
app.use(errorHandler);


app.listen(3000);