import { Redirect } from 'expo-router';

export default function CreatePlaceholder() {
    // If navigation somehow reaches here, send them back
    return <Redirect href="/" />;
}
