import {type RouteConfig, index, route} from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route('visualizer/:id', './routes/visualizer.$id.tsx'),
    // Add catch-all route at the end
    route("*", "./routes/catchall.tsx")
] satisfies RouteConfig;